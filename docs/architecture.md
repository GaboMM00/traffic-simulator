# Arquitectura del sistema

## Visión general

El sistema sigue una arquitectura cliente-servidor con comunicación bidireccional en tiempo real. El backend ejecuta dos simulaciones concurrentes e independientes y transmite su estado al frontend cada 100ms.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                 │
│  ConfigPage → LoadingPage → SimulationPage → ResultsPage       │
│                                   │                            │
│          Canvas (Konva)    EventFeed    Métricas               │
│          SEQ panel │ PAR panel                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │ WebSocket STOMP + REST HTTP
┌───────────────────────▼─────────────────────────────────────────┐
│                       BACKEND (Spring Boot)                      │
│                                                                  │
│  REST Controllers → Simulator → SimulationRunner × 2            │
│                                      │                           │
│              VehicleThread × N   TrafficLightThread × M          │
│              DeadlockDetector    EventBus                        │
│              SimulationBroadcaster → /topic/world-state/*        │
└─────────────────────────────────────────────────────────────────┘
```

## Backend

### Capas

**`domain/`** — Modelos puros sin dependencias de Spring.

**`simulation/`** — Motor de simulación con toda la lógica concurrente.

**`controller/`** — Endpoints REST que delegan en el `Simulator`.

**`websocket/`** — Broadcaster que convierte estado interno en DTOs y los publica.

**`event/`** — Bus de eventos interno que desacopla la simulación del broadcaster.

**`metrics/`** — Cálculo de métricas finales e intermedias.

**`config/`** — Configuración de Spring (CORS, WebSocket, beans).

---

### Dominio

#### City (grafo de la ciudad)

La ciudad es un grafo dirigido construido con un patrón Manhattan alternado que garantiza conectividad sin crear cruces bidireccionales:

- **Filas pares** (`row % 2 == 0`): calles de OESTE a ESTE
- **Filas impares**: calles de ESTE a OESTE
- **Columnas pares** (`col % 2 == 0`): calles de NORTE a SUR
- **Columnas impares**: calles de SUR a NORTE

Las esquinas tienen aristas adicionales para garantizar conectividad fuerte entre todos los nodos.

Los semáforos se asignan con paso `ceil(gridSize / 4)`, resultando en aproximadamente 16 semáforos para un grid de 12×12.

#### Vehicle

Cada vehículo es thread-safe por diseño:

| Campo | Tipo | Motivo |
|---|---|---|
| `state` | `AtomicReference<VehicleState>` | Escrituras desde VehicleThread, lecturas desde Broadcaster |
| `currentPosition` | `volatile Coordinate` | Publicación sin locks |
| `waitTimeMs` | `AtomicLong` | Incrementos concurrentes |
| `travelTimeMs` | `long` | Solo escribe el propio VehicleThread al finalizar |

#### TrafficLight

| Campo | Tipo | Motivo |
|---|---|---|
| `state` | `AtomicReference<TrafficLightState>` | TrafficLightThread escribe, VehicleThread lee |
| `remainingMs` | `volatile long` | Actualización continua para display |
| `queueSize` | `AtomicInteger` | Múltiples vehículos incrementan/decrementan |

---

### Motor de simulación

#### Simulator (orquestador)

El `Simulator` es un bean Spring Singleton que administra el ciclo de vida de dos `SimulationRunner` —uno para el modo SEQUENTIAL y otro para PARALLEL. Ambos reciben los mismos pares origen-destino generados aleatoriamente al inicio.

Al llamar a `stop()`, el Simulator también ejecuta el **benchmark de routing**: calcula la mediana de 5 rondas de `calculateAll()` para ambos modos sobre una muestra de 30 pares.

#### SimulationRunner (por modo)

No es un bean Spring; se instancia directamente por el Simulator. Controla:

1. **Timer thread** — Incrementa `simulationTimeMs` cada 10ms con `AtomicLong`.
2. **TrafficLightThreads** — Un hilo por semáforo (≈16). Ciclan GREEN→YELLOW→RED→GREEN.
3. **VehicleThreads** — Un hilo por vehículo en un `FixedThreadPool(N)`.
4. **DeadlockDetector** — Hilo único que ejecuta análisis de grafo de espera cada 2s.
5. **EventBus privado** — Recibe eventos de hilos de vehículos y semáforos. Inyecta el modo (SEQ/PAR) y reenvía al EventBus compartido de Spring.

#### VehicleThread (ciclo de vida)

```
CALCULATING
   └─ Adquiere calcSemaphore
   └─ Ejecuta A* (origin → destination)
   └─ Libera calcSemaphore
   └─ Si hay ruta → MOVING
   └─ Si no hay ruta → NO_ROUTE (fin)

MOVING (por cada waypoint)
   └─ Si semáforo en posición actual → esperar GREEN
   └─ tryLock(siguiente intersección) cada 50ms
   └─ Mover posición
   └─ unlock(intersección anterior)
   └─ Sleep(500ms / simulationSpeed)
   └─ Al llegar al destino → COMPLETED
   └─ Publicar VEHICLE_ARRIVED
```

#### Semáforo de cálculo (diferenciador entre modos)

| Modo | `calcSemaphore` | Comportamiento |
|---|---|---|
| SEQUENTIAL | `Semaphore(1)` | Un vehículo calcula su ruta a la vez |
| PARALLEL | `Semaphore(N)` | Todos calculan simultáneamente en ForkJoinPool |

Este es el punto de comparación central del proyecto: el speedup entre ambos modos.

---

### Routing

#### AStarRouteCalculator

Implementación estándar de A* sobre el grafo dirigido de `City`:

- **Heurística**: distancia Manhattan entre coordenadas
- **Costo de arista**: 1 (homogéneo)
- **Complejidad**: O((V + E) log V) ≈ O(N² log N) donde N = gridSize

Método `calculateAll(pairs)`: procesa los pares **secuencialmente** en el hilo llamador.

#### ParallelRouteCalculator

Envuelve a `AStarRouteCalculator`. El método `calculateAll(pairs)` distribuye cada par como un `CompletableFuture` al `ForkJoinPool.commonPool()` y recolecta los resultados en orden. El speedup teórico es proporcional al número de núcleos disponibles.

---

### Sincronización y deadlocks

#### IntersectionLock

Protege el acceso exclusivo a cada intersección del mapa. Protocolo:

```
tryLock(intersectionId)
    └─ Si libre → registrar holder → return true
    └─ Si ocupado → return false (reintento en 50ms por VehicleThread)

unlock(intersectionId)
    └─ clearHolder
    └─ Notificar (libera el nodo para otro vehículo)
```

`markAsVictim(vehicleId)` permite al DeadlockDetector señalar a un vehículo para que ceda.

#### DeadlockDetector

Ejecuta cada 2 segundos:

1. Construye el **grafo de espera**: arista A→B si el vehículo A espera la intersección que tiene B.
2. Busca ciclos con DFS.
3. Si detecta un ciclo, elige el vehículo con menor `waitTimeMs` como víctima (minimiza impacto).
4. Lo marca como víctima. El VehicleThread de esa víctima detecta la marca y salta el siguiente waypoint.

---

### Eventos

`SimulationEvent` tiene un `payload` de tipo `Map<String, Object>` que varía por tipo:

| Tipo | Payload relevante |
|---|---|
| `VEHICLE_ARRIVED` | `vehicleId`, `travelTimeMs`, `waitTimeMs`, `mode` |
| `VEHICLE_WAITING` | `vehicleId`, `waitTimeMs`, `intersectionId` |
| `HIGH_CONGESTION` | `intersectionId`, `waitCount` |
| `DEADLOCK_DETECTED` | `victimId`, `cycleLength` |
| `TRAFFIC_LIGHT_EXTENDED` | `intersectionId`, `queueSize`, `extensionCount` |
| `ROUTE_CALCULATION_FINISHED` | `seqTimeMs`, `parTimeMs`, `speedup` |
| `SIMULATION_FINISHED` | `mode`, `totalVehicles`, `completedVehicles` |

---

### WebSocket y broadcast

**Configuración:**
- Endpoint SockJS: `ws://localhost:8080/ws`
- Broker en memoria con prefijo `/topic`
- CORS habilitado para `http://localhost:5173`

**Topics publicados cada 100ms:**

| Topic | Contenido |
|---|---|
| `/topic/world-state/seq` | `WorldStateDTO` del runner SEQUENTIAL |
| `/topic/world-state/par` | `WorldStateDTO` del runner PARALLEL |
| `/topic/events` | `SimulationEventDTO[]` (lote de eventos pendientes) |

**Intervalo de métricas:** 500ms (snapshot de `SimulationMetrics`).

---

## Frontend

### Máquina de estados de la aplicación

```
IDLE ──────────────────► CONFIGURING
                              │
                    (POST /start)
                              │
                              ▼
                          LOADING
                              │
                    (WebSocket listo)
                              │
                              ▼
                    RUNNING ◄──► PAUSED
                              │
                  (SIMULATION_FINISHED × 2)
                              │
                              ▼
                          FINISHING
                              │
                    (usuario acepta)
                              │
                              ▼
                          RESULTS
                              │
                         (reset)
                              │
                              ▼
                            IDLE
```

### Stores (Zustand)

| Store | Responsabilidad |
|---|---|
| `useSimulationStore` | Estado de app, world-states SEQ/PAR, eventos, resultados |
| `useConfigStore` | Parámetros de configuración, máximo de vehículos |
| `useUiStore` | Sidebar, vehículo seleccionado, preferencias de visualización |

### Renderización del mapa (Konva)

La simulación se renderiza en un canvas 2D con tres capas superpuestas:

1. **GridLayer** — Calles y fondo. Solo se redibuja si cambia el grid size.
2. **TrafficLightLayer** — Círculos de semáforos. Redibuja al cambiar `trafficLights[]`.
3. **VehicleLayer** — Cuadrados de vehículos con trail. Redibuja cada 100ms con nuevo world-state.

La separación en capas reduce el área de redibujado y mantiene 60fps incluso con 200 vehículos.

### Servicios

**`WebSocketService`** (singleton):
- Conecta con STOMP sobre SockJS
- Reconexión automática con backoff exponencial
- Distribuye mensajes a callbacks registrados

**`ApiService`**:
- Wrapper tipado sobre `fetch`
- Todos los métodos son `async` y lanzan errores HTTP como excepciones
- Base URL: `http://localhost:8080/api`

---

## Hilos activos durante una simulación

Para una configuración de 50 vehículos y grid 12×12:

| Componente | Hilos | Notas |
|---|---|---|
| VehicleThreads | 50 × 2 = 100 | Un pool por runner |
| TrafficLightThreads | 16 × 2 = 32 | Uno por semáforo por runner |
| DeadlockDetector | 1 × 2 = 2 | Un hilo por runner |
| Timer | 1 × 2 = 2 | Incrementa reloj de simulación |
| Broadcaster (Spring) | 1 | Publica ambos runners |
| **Total aproximado** | **~137** | |

Los hilos de vehículos pasan la mayor parte del tiempo en `sleep()` o bloqueados en el semáforo de cálculo, por lo que el uso real de CPU es proporcional al número de vehículos que se mueven simultáneamente.
