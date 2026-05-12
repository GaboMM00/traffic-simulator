# 🧠 PROMPT MAESTRO — Simulador de Tráfico Urbano
## Programación Paralela y Concurrente

---

> **Instrucciones de uso:** Pega este documento completo al inicio de cada sesión con Claude Code.
> Este es el documento de verdad del proyecto. Toda decisión técnica debe respetar lo aquí definido.
> Si algo no está cubierto, pregunta antes de inventar.

---

## 🎯 CONTEXTO DEL PROYECTO

Eres un desarrollador senior trabajando en un proyecto académico universitario llamado
**"Simulador de Tráfico Urbano"** para la materia de Programación Paralela y Concurrente.

El proyecto simula el flujo de vehículos en una ciudad representada como una cuadrícula.
Cada vehículo y cada semáforo es un hilo concurrente. El sistema debe demostrar sincronización,
evitar colisiones y medir el rendimiento entre ejecución secuencial y paralela.

Tu trabajo es construir este sistema completo: backend en Java y frontend en React/TypeScript,
siguiendo EXACTAMENTE la arquitectura, estructura de directorios y decisiones técnicas
definidas en este documento. No improvises, no cambies el stack, no agregues librerías
no listadas aquí sin preguntar primero.

---

## 🏗️ STACK TECNOLÓGICO

### Backend
- **Java 21**
- **Spring Boot 3.2**
- **Maven**
- **Lombok**
- **WebSocket + STOMP + SockJS**
- **SLF4J + Logback** para logs

### Frontend
- **React 18**
- **TypeScript 5**
- **Vite 5**
- **TailwindCSS 3**
- **Konva.js + react-konva** → canvas del mapa
- **Recharts** → gráficas de resultados
- **Framer Motion** → animaciones y transiciones entre pantallas
- **@stomp/stompjs + sockjs-client** → cliente WebSocket
- **Zustand** → estado global
- **React Router v6** → navegación
- **Lucide React** → íconos
- **clsx + tailwind-merge** → clases condicionales

---

## 📁 ESTRUCTURA DE DIRECTORIOS

### Raíz del repositorio
```
traffic-simulator/
├── backend/
├── frontend/
├── docs/
└── README.md
```

### Backend completo
```
backend/
└── src/
    └── main/
        ├── java/
        │   └── com/trafico/simulator/
        │       ├── config/
        │       │   ├── WebSocketConfig.java
        │       │   └── SimulationConfig.java
        │       ├── controller/
        │       │   ├── SimulationController.java
        │       │   └── ConfigurationController.java
        │       ├── domain/
        │       │   ├── model/
        │       │   │   ├── City.java
        │       │   │   ├── Intersection.java
        │       │   │   ├── Street.java
        │       │   │   ├── Vehicle.java
        │       │   │   └── TrafficLight.java
        │       │   ├── enums/
        │       │   │   ├── TrafficLightState.java
        │       │   │   ├── VehicleState.java
        │       │   │   ├── Direction.java
        │       │   │   └── ExecutionMode.java
        │       │   └── valueobject/
        │       │       ├── Coordinate.java
        │       │       ├── Route.java
        │       │       └── SimulationParams.java
        │       ├── simulation/
        │       │   ├── Simulator.java
        │       │   ├── SimulationState.java
        │       │   ├── thread/
        │       │   │   ├── VehicleThread.java
        │       │   │   └── TrafficLightThread.java
        │       │   ├── routing/
        │       │   │   ├── RouteCalculator.java
        │       │   │   ├── AStarRouteCalculator.java
        │       │   │   ├── DijkstraRouteCalculator.java
        │       │   │   └── ParallelRouteCalculator.java
        │       │   └── sync/
        │       │       ├── IntersectionLock.java
        │       │       └── DeadlockDetector.java
        │       ├── metrics/
        │       │   ├── MetricsCollector.java
        │       │   ├── SimulationMetrics.java
        │       │   └── VehicleMetrics.java
        │       ├── event/
        │       │   ├── SimulationEvent.java
        │       │   ├── SimulationEventType.java
        │       │   └── EventBus.java
        │       └── websocket/
        │           ├── SimulationBroadcaster.java
        │           └── dto/
        │               ├── WorldStateDTO.java
        │               ├── VehicleDTO.java
        │               ├── TrafficLightDTO.java
        │               ├── MetricsDTO.java
        │               └── SimulationEventDTO.java
        └── resources/
            └── application.yml
```

### Frontend completo
```
frontend/
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── pages/
    │   ├── welcome/
    │   │   ├── WelcomePage.tsx
    │   │   └── AnimatedBackground.tsx
    │   ├── configuration/
    │   │   ├── ConfigurationPage.tsx
    │   │   ├── CitySection.tsx
    │   │   ├── VehiclesSection.tsx
    │   │   ├── SimulationSection.tsx
    │   │   ├── MapPreview.tsx
    │   │   └── PresetButtons.tsx
    │   ├── loading/
    │   │   └── LoadingPage.tsx
    │   ├── simulation/
    │   │   ├── SimulationPage.tsx
    │   │   ├── TopBar.tsx
    │   │   ├── BottomBar.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── EventFeed.tsx
    │   └── results/
    │       ├── ResultsPage.tsx
    │       ├── MetricCards.tsx
    │       ├── CompletionModal.tsx
    │       └── charts/
    │           ├── TravelTimeHistogram.tsx
    │           ├── CompletionTimeline.tsx
    │           ├── CongestionHeatmap.tsx
    │           ├── SequentialVsParallelChart.tsx
    │           └── WaitTimePieChart.tsx
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Slider.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Card.tsx
    │   │   ├── Toast.tsx
    │   │   └── Tooltip.tsx
    │   └── map/
    │       ├── CityMap.tsx
    │       ├── GridLayer.tsx
    │       ├── VehicleLayer.tsx
    │       ├── VehicleShape.tsx
    │       ├── TrafficLightLayer.tsx
    │       ├── TrafficLightShape.tsx
    │       ├── StreetLabels.tsx
    │       └── CongestionOverlay.tsx
    ├── hooks/
    │   ├── useWebSocket.ts
    │   ├── useSimulation.ts
    │   ├── useMapControls.ts
    │   └── useMetrics.ts
    ├── store/
    │   ├── simulation.store.ts
    │   ├── config.store.ts
    │   └── ui.store.ts
    ├── services/
    │   ├── websocket.service.ts
    │   └── api.service.ts
    ├── types/
    │   ├── simulation.types.ts
    │   ├── vehicle.types.ts
    │   ├── traffic-light.types.ts
    │   ├── metrics.types.ts
    │   └── config.types.ts
    ├── constants/
    │   ├── colors.ts
    │   ├── simulation.constants.ts
    │   └── map.constants.ts
    └── utils/
        ├── color.utils.ts
        ├── map.utils.ts
        └── format.utils.ts
```

---

## 🗺️ MODELO DEL MAPA

### Generación algorítmica
- El mapa es un **grafo dirigido** generado algorítmicamente según el gridSize configurado
- No existe un archivo JSON estático del mapa
- Cada nodo es una intersección con coordenadas `(col, row)` desde `(0,0)` arriba izquierda
- Las aristas tienen peso = 1 (todas igual distancia)
- Las intersecciones se identifican como `I-{col}-{row}` ejemplo: `I-4-7`

### Dirección de calles — sistema Manhattan alternado
```
Calles HORIZONTALES filas pares   → OESTE a ESTE  (→)
Calles HORIZONTALES filas impares → ESTE a OESTE  (←)
Calles VERTICALES columnas pares  → NORTE a SUR   (↓)
Calles VERTICALES columnas impares→ SUR a NORTE   (↑)
```
Esto garantiza que siempre existe ruta entre cualquier par de nodos.

### Distribución de semáforos
```
Intersección (col, row) tiene semáforo si: col % 2 == 0 AND row % 2 == 0
Grid 12×12 → 16 semáforos (cumple el requisito de 10-20)
Escala automáticamente para otros grid sizes
```

### Puntos de entrada/salida de vehículos
- Los vehículos solo entran por nodos del **borde** del grid
- Los destinos pueden ser cualquier nodo que no sea el punto de partida
- Si origen == destino, se reasigna destino aleatoriamente

### Sin nombres de calles en el canvas
- No se muestran nombres ni etiquetas sobre el mapa en ningún momento
- Los IDs de intersección solo aparecen en **tooltips al hacer hover**

---

## 📐 ESCALADO DEL CANVAS

```
cellSize = Math.floor(Math.min(canvasWidth, canvasHeight) / gridSize)

Grid  8×8  → cellSize ≈ 90px
Grid 12×12 → cellSize ≈ 60px
Grid 16×16 → cellSize ≈ 45px
Grid 20×20 → cellSize ≈ 36px

vehicleWidth         = cellSize * 0.5
vehicleHeight        = cellSize * 0.3
vehicleBorderRadius  = vehicleWidth * 0.3
trafficLightRadius   = cellSize * 0.15
trafficLightGlow     = trafficLightRadius * 2.5

Área del canvas = viewport - topbar(48px) - bottombar(56px) - sidebar(320px)
```

---

## 🔄 MÁQUINA DE ESTADOS DE LA APLICACIÓN

```
IDLE → CONFIGURING → LOADING → RUNNING ⇄ PAUSED → FINISHING → RESULTS
                                                                    ↓
                                              CONFIGURING ← ← ← ← ←
                                              IDLE        ← ← ← ← ←
```

### Tipo en TypeScript
```typescript
type AppState =
  | 'IDLE'
  | 'CONFIGURING'
  | 'LOADING'
  | 'RUNNING'
  | 'PAUSED'
  | 'FINISHING'
  | 'RESULTS'
```

Framer Motion con AnimatePresence maneja las transiciones entre pantallas.

---

## 🖥️ PANTALLAS Y EXPERIENCIA DE USUARIO

### 1. Pantalla de Bienvenida (IDLE)
- Nombre del proyecto y subtítulo "Programación Paralela y Concurrente"
- Fondo animado: grid 12×12 con vehículos moviéndose en loop, blur 8px, overlay oscuro opacity 0.15
- El fondo es una animación CSS/Canvas independiente, NO conecta al backend
- Botón único y prominente: "Nueva Simulación"
- Nombres del equipo y versión en el footer
- Solo un botón de acción, nada más

### 2. Pantalla de Configuración (CONFIGURING)
- Una sola página, NO wizard
- Organizada en 3 secciones con tarjetas:
  - 🗺️ Ciudad: grid size con preview visual en tiempo real
  - 🚗 Vehículos: cantidad, orígenes, destinos
  - ⚙️ Simulación: modo, velocidad semáforos, velocidad inicial
- Preview del mapa a la derecha que actualiza al cambiar grid size (grid vacío)
- Badge de carga al mover slider de vehículos: ⚡ Ligero / ⚠️ Moderado / 🔥 Intenso
- 3 presets rápidos en botones:
  - `Demo rápida` → 12×12, 30 vehículos, velocidad 2x
  - `Estándar`    → 12×12, 80 vehículos, 1x (defaults)
  - `Estrés máximo` → 16×16, 200 vehículos, 1x
- Validaciones en tiempo real, botón Iniciar desactivado si hay errores
- Botón "Restablecer defaults" en footer

#### Parámetros configurables
| Parámetro | Rango | Default |
|---|---|---|
| Tamaño del grid | 8×8 — 20×20 | 12×12 |
| Número de vehículos | 20 — 200 | 50 |
| Modo de ejecución | Secuencial / Paralelo | Paralelo |
| Duración luz verde | 1 — 15 s | 5 s |
| Duración luz amarilla | 1 — 5 s | 2 s |
| Duración luz roja | 1 — 15 s | 6 s |
| Puntos de partida | Aleatorio / Manual | Aleatorio |
| Destinos | Aleatorio / Manual | Aleatorio |
| Velocidad de simulación | 0.5x — 3x | 1x |
| Semáforos inteligentes | Activar / Desactivar | Desactivado |

#### Validación de vehículos por grid
```
maxVehicles = Math.min(200, gridSize * gridSize * 0.4)

Grid  8×8  → máx 40
Grid 10×10 → máx 70 (aproximado por fórmula)
Grid 12×12 → máx 57 (por fórmula exacta, mostrar como 110 para UX)
Grid 16×16 → máx 102 (por fórmula, mostrar como 150 para UX)
Grid 20×20 → máx 200
```
Usar la fórmula y redondear hacia abajo.

### 3. Pantalla de Carga (LOADING)
- 3 etapas con barra de progreso individual:
  1. `Construyendo ciudad...`
  2. `Calculando rutas...`
  3. `Iniciando vehículos...`
- Animación suave entre etapas
- Si tarda más de 10s: banner "Esto está tardando más de lo esperado..."
- No se puede cancelar la carga

### 4. Pantalla de Simulación (RUNNING / PAUSED)

#### Layout
```
┌────────────────────────────────────────────────────────┐
│  TOPBAR: Nombre | Modo badge | Cronómetro | Controles  │
├────────────────────────────────────┬───────────────────┤
│                                    │                   │
│         MAPA PRINCIPAL             │  Panel métricas   │
│         (75% del ancho)            │  en tiempo real   │
│         Konva Canvas               │                   │
│                                    │  Lista vehículos  │
│                                    │  (scrolleable)    │
│                                    │                   │
│                                    │  Feed de eventos  │
├────────────────────────────────────┴───────────────────┤
│  BOTTOMBAR: Slider velocidad | Pausa | Reiniciar       │
└────────────────────────────────────────────────────────┘
```

#### Controles de simulación
- Pausar / Reanudar
- Velocidad ajustable en tiempo real (slider 0.5x — 3x)
- Reiniciar con los mismos parámetros
- Volver a configuración
- Botón toggle para etiquetas de ID sobre vehículos
- Botón para colapsar/expandir sidebar
- Botón F o ícono para pantalla completa

#### Interacción con el mapa
- Zoom: scroll del mouse
- Pan: clic sostenido y arrastrar
- Clic en intersección: tooltip con ID, semáforo, vehículos en espera
- Clic en vehículo: panel lateral muestra detalle de ese vehículo
- Hover sobre vehículo: tooltip con ID, origen, destino, tiempo, estado
- Botón "Centrar mapa" regresa zoom y posición al estado inicial
- Botón "Fit to screen" ajusta zoom para ver todo el mapa

#### Identidad visual de vehículos
- Color asignado aleatoriamente desde paleta de 10 colores predefinidos
- El vehículo en primer lugar tiene borde/badge dorado
- Vehículos esperando: opacidad 50%
- Vehículos en movimiento: estela/trail de 2-3 frames
- Vehículos rotan visualmente según su dirección de movimiento

#### Modo Follow (seguimiento de vehículo)
- Activar: clic en vehículo del mapa o de la lista lateral
- El canvas hace pan suave (300ms) para centrar el vehículo
- El canvas sigue al vehículo en cada frame con lerp factor 0.1
- Cuando el vehículo llega: follow se desactiva, canvas queda centrado ahí
- Toast: "Vehículo V-007 llegó a su destino"
- Cancelar follow: clic en cualquier parte del canvas o tecla Escape

#### Métricas en tiempo real (panel lateral)
| Métrica | Visualización |
|---|---|
| Vehículos activos / completados | Contador numérico |
| Tiempo transcurrido | Cronómetro |
| Vehículo líder (menor tiempo completado) | ID + tiempo |
| Intersección más congestionada | ID + resaltada en mapa |
| Vehículos en espera ahora mismo | Contador numérico |
| Modo de ejecución activo | Badge Secuencial / Paralelo |

#### Feed de eventos (panel lateral)
- Máximo 20 eventos visibles, más nuevos arriba
- Solo eventos relevantes con ícono y color
- Tipos de eventos visuales:
  - 🏁 Vehículo llegó a destino
  - 🔴 Alta congestión en intersección
  - 🚦 Vehículo esperó mucho en semáforo
  - 🥇 Nuevo vehículo en primer lugar
  - ⚡ Semáforo inteligente activó extensión

### 5. Transición a Resultados (FINISHING)
1. El mapa se congela con overlay semitransparente oscuro
2. Modal central: "¡Simulación completada! 🎉" con tiempo total y vehículo ganador
3. Botones: "Ver resultados completos" | "Revisar mapa"
4. Si "Ver resultados": fade transition hacia ResultsPage
5. Si "Revisar mapa": cierra modal, mapa congelado interactuable

### 6. Pantalla de Resultados (RESULTS)
- Los resultados se revelan progresivamente con animaciones escalonadas
- El heatmap se renderiza con animación de "pintado" progresivo

#### Tarjetas numéricas
- 🥇 Vehículo que llegó primero + tiempo exacto
- ⏱️ Tiempo promedio de viaje
- 🔴 Intersección más congestionada (ID + cantidad de esperas)
- ⚡ Tiempo de rutas: secuencial vs paralelo (ms) + speedup calculado
- 🚗 Total completados vs total inicial
- ⏳ Tiempo de espera promedio en semáforos (ms y %)

#### Gráficas
- 📊 Histograma: distribución de tiempos de viaje por vehículo
- 📈 Línea de tiempo: vehículos completados acumulados a lo largo del tiempo
- 🔥 Heatmap: overlay sobre el grid mostrando congestión por intersección
- 📊 Barras comparativas: tiempo secuencial vs paralelo
- 🥧 Pie chart: % tiempo en movimiento vs tiempo esperando semáforos

#### Acciones desde resultados
- "Repetir con mismos parámetros"
- "Nueva simulación" (vuelve a configuración)
- "Exportar reporte" (descarga .csv y .txt simultáneamente)

---

## 🚗 CICLO DE VIDA DE VEHÍCULOS

### Estados
```
CALCULATING → MOVING → WAITING → COMPLETED
                                → NO_ROUTE (excluido de métricas)
```

### Al llegar al destino
1. VehicleThread publica evento VEHICLE_ARRIVED
2. Estado cambia a COMPLETED
3. Frontend recibe COMPLETED
4. Animación fadeout: opacidad 1→0 en 600ms
5. Desaparece del canvas
6. En lista lateral pasa a sección "Completados" colapsable
7. Métricas finales disponibles al hacer clic en él en la lista

### Criterio de "primer lugar"
- El vehículo COMPLETADO con menor tiempo de viaje total
- Si empate → gana el de menor ID numérico
- El badge de líder se muestra solo cuando al menos un vehículo ha completado

---

## 🚦 SEMÁFOROS INTELIGENTES (cuando están activados)

```
1. Monitorea el tamaño de cola en su intersección
2. Si cola > 5 vehículos → extiende el verde 2s adicionales
3. Extensión máxima: 6s extra (3 extensiones por ciclo)
4. Después de extensión máxima cicla normalmente
5. Frontend muestra ícono ⚡ sobre el semáforo en modo extendido
```

---

## 🔄 COMPARACIÓN SECUENCIAL VS PARALELO

```
Al iniciar SIEMPRE:
1. Calcular todas las rutas en SECUENCIAL → guardar T_seq
2. Calcular todas las rutas en PARALELO   → guardar T_par
3. Usar el resultado del modo que eligió el usuario para la simulación
4. Mostrar ambos tiempos y speedup en pantalla de resultados

Esto permite la comparación académica sin importar el modo elegido.
```

---

## 📡 CONTRATOS DE API

### REST Endpoints

#### POST /api/simulation/start
**Request:**
```json
{
  "gridSize": 12,
  "vehicleCount": 50,
  "executionMode": "PARALLEL",
  "trafficLight": {
    "greenDurationMs": 5000,
    "yellowDurationMs": 2000,
    "redDurationMs": 6000
  },
  "originMode": "RANDOM",
  "destinationMode": "RANDOM",
  "simulationSpeed": 1.0,
  "smartTrafficLights": false
}
```

**Response:**
```json
{
  "simulationId": "SIM-20240315-001",
  "status": "LOADING",
  "gridSize": 12,
  "vehicleCount": 50,
  "trafficLightCount": 16,
  "estimatedLoadTimeMs": 800
}
```

#### POST /api/simulation/pause
#### POST /api/simulation/resume
#### POST /api/simulation/stop

**Response de /stop:**
```json
{
  "simulationId": "SIM-20240315-001",
  "completedAt": "2024-03-15T14:32:00",
  "totalDurationMs": 45200,
  "executionMode": "PARALLEL",
  "routeCalculation": {
    "sequentialTimeMs": 340,
    "parallelTimeMs": 89
  },
  "vehicles": [...],
  "summary": {
    "firstVehicleId": "V-001",
    "firstVehicleTravelTimeMs": 12400,
    "averageTravelTimeMs": 18700,
    "averageWaitTimeMs": 4100,
    "averageWaitTimePercent": 21.9,
    "totalCompleted": 50,
    "totalVehicles": 50,
    "mostCongestedIntersectionId": "I-4-6",
    "mostCongestedIntersectionWaits": 23
  }
}
```

#### GET /api/simulation/status

### WebSocket Canales (STOMP)

#### SUBSCRIBE /topic/world-state → cada 100ms
```json
{
  "tick": 1042,
  "simulationTimeMs": 18400,
  "vehicles": [...],
  "trafficLights": [...],
  "metrics": {
    "activeVehicles": 47,
    "completedVehicles": 3,
    "waitingVehicles": 12,
    "mostCongestedIntersectionId": "I-4-6"
  }
}
```

#### SUBSCRIBE /topic/events → eventos discretos
```json
{
  "type": "VEHICLE_ARRIVED",
  "timestamp": 18400,
  "payload": {
    "vehicleId": "V-007",
    "arrivalOrder": 1,
    "travelTimeMs": 12400
  }
}
```

**Tipos de eventos:**
```
VEHICLE_ARRIVED       → vehículo llegó a destino
VEHICLE_WAITING       → vehículo esperando más de 5s
HIGH_CONGESTION       → intersección superó 5 vehículos en cola
SIMULATION_FINISHED   → todos los vehículos llegaron
DEADLOCK_DETECTED     → deadlock detectado y resuelto
TRAFFIC_LIGHT_EXTENDED→ semáforo inteligente extendió verde
```

#### SUBSCRIBE /topic/metrics → cada 500ms
#### SUBSCRIBE /topic/status → cambios de estado del sistema

---

## 🔒 CONCURRENCIA — DECISIONES TÉCNICAS

```java
// Granularidad fina: un lock por intersección, no uno global
IntersectionLock      → ReentrantLock por cada intersección

// Semáforos como hilos temporizados
TrafficLightThread    → ScheduledExecutorService

// Modo paralelo
ParallelRouteCalculator → ForkJoinPool.commonPool()

// Modo secuencial
AStarRouteCalculator  → ejecución en hilo único secuencial

// Estado compartido thread-safe
SimulationState       → ConcurrentHashMap + AtomicInteger + volatile

// RouteCalculator es interfaz → A* y Dijkstra la implementan
// ParallelRouteCalculator la envuelve para ejecución paralela
```

### Prevención de deadlocks
- `DeadlockDetector` monitorea el estado de los locks periódicamente
- Si detecta deadlock: libera el lock del vehículo con mayor tiempo de espera
- Publica evento `DEADLOCK_DETECTED` al EventBus
- Se registra en logs con nivel WARN

---

## 🎨 PALETA DE COLORES

```typescript
export const COLORS = {
  background:     '#0d1117',
  surface:        '#161b22',
  surfaceHover:   '#1c2333',
  border:         '#30363d',

  street:         '#21262d',
  block:          '#161b22',
  streetLabel:    '#8b949e',

  trafficGreen:   '#3fb950',
  trafficYellow:  '#d29922',
  trafficRed:     '#f85149',

  vehicleColors: [
    '#58a6ff', '#bc8cff', '#ff7b72',
    '#ffa657', '#3fb950', '#39d353',
    '#f78166', '#79c0ff', '#d2a8ff',
    '#56d364'
  ],

  accent:         '#58a6ff',
  accentHover:    '#79c0ff',
  textPrimary:    '#e6edf3',
  textSecondary:  '#8b949e',
  textMuted:      '#484f58',

  success:        '#3fb950',
  warning:        '#d29922',
  danger:         '#f85149',
  info:           '#58a6ff',
  gold:           '#f0c060',
} as const
```

---

## ⚠️ MANEJO DE ERRORES Y EDGE CASES

| Situación | Comportamiento |
|---|---|
| Backend se cae | Banner rojo: "Conexión perdida. Intentando reconectar..." con reintentos cada 3s |
| Demasiados vehículos para el grid | Validación en configuración con mensaje y botón Iniciar bloqueado |
| Vehículo sin ruta posible | Estado NO_ROUTE, excluido de métricas, log WARN en backend |
| Simulación sin terminar en 5 min | Banner amarillo con opción de finalizar y ver resultados parciales |
| Segunda pestaña del navegador | Mensaje: "Ya hay una simulación activa en otra pestaña" |
| Cierre del navegador | Backend detecta desconexión WebSocket y detiene los hilos limpiamente |

---

## 📄 EXPORTACIÓN DE REPORTE

### CSV — `reporte-simulacion-{id}.csv`
Encabezados resumen: `simulationId, gridSize, vehicleCount, executionMode, totalDurationMs,
sequentialRouteTimeMs, parallelRouteTimeMs, speedup, firstVehicleId,
firstVehicleTravelTimeMs, averageTravelTimeMs, averageWaitTimeMs,
averageWaitPercent, mostCongestedIntersection, totalCompleted`

Encabezados por vehículo: `vehicleId, arrivalOrder, travelTimeMs, waitTimeMs,
waitPercent, routeLength, completed`

### TXT — `reporte-simulacion-{id}.txt`
Reporte en texto plano con secciones: RENDIMIENTO, RESULTADOS y CONGESTIÓN.

---

## ♿ ACCESIBILIDAD

- Contraste mínimo AA en todos los textos
- Los semáforos muestran letra además del color: V / A / R
- Los vehículos tienen número visible encima
- Todos los botones tienen aria-labels descriptivos
- Navegación básica por teclado en formularios de configuración

---

## 📏 REGLAS DE CÓDIGO — OBLIGATORIAS

### Generales
- Un componente React por archivo
- Props siempre tipadas con interface, nunca inline ni any
- Hooks personalizados para toda lógica con estado
- Cero lógica de negocio en componentes React — solo presentación
- Servicios para toda comunicación con el backend
- Constantes en /constants, nunca hardcodeadas en componentes
- Tipos en /types, nunca definidos inline en componentes

### Comentarios — OBLIGATORIO en todos los archivos
- Todos los archivos Java con JavaDoc en clases y métodos
- Comentarios en bloques críticos de concurrencia explicando el POR QUÉ
- Todos los componentes React con comentario de su propósito
- Todos los comentarios en **ESPAÑOL**

### Convenciones Java
- `PascalCase` → clases e interfaces
- `camelCase` → métodos y variables
- `UPPER_SNAKE_CASE` → constantes
- `lowercase` → paquetes
- Logs con SLF4J, nunca System.out.println

### Convenciones TypeScript/React
- `PascalCase` → componentes y tipos/interfaces
- `camelCase` → funciones, variables y hooks
- `kebab-case` → nombres de archivos (.tsx, .ts)
- Prefijo `use` → todos los hooks personalizados

---

## 🔧 CONFIGURACIÓN

### application.yml
```yaml
server:
  port: 8080
spring:
  application:
    name: traffic-simulator
  web:
    cors:
      allowed-origins: "http://localhost:5173"
websocket:
  broadcast-interval-ms: 100
  metrics-interval-ms: 500
logging:
  level:
    com.trafico.simulator: DEBUG
    root: INFO
```

### Vite config (proxy al backend)
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/ws': { target: 'http://localhost:8080', ws: true }
  }
}
```

---

## 🚀 ORDEN DE CONSTRUCCIÓN RECOMENDADO

1. Estructura base (directorios + configs)
2. Dominio y modelos (enums, value objects, modelos)
3. Motor de simulación (RouteCalculator, threads, Simulator)
4. Métricas y eventos (EventBus, MetricsCollector)
5. API y WebSocket (DTOs, controllers, broadcaster)
6. Frontend base (Tailwind, Router, Zustand stores, tipos)
7. Pantallas (Welcome → Config → Loading → Simulation → Results)
8. Conectividad (WebSocket service, hooks)
9. Gráficas y resultados (Recharts, exportación)
10. Pulido (Framer Motion, tooltips, toasts, accesibilidad)

---

## ✅ CHECKLIST DE VALIDACIÓN

**Backend por módulo:**
- [ ] JavaDoc completo en español en clase y métodos
- [ ] Sin System.out.println (solo SLF4J)
- [ ] Sin números mágicos (todo en constantes)
- [ ] DTO separado del modelo de dominio
- [ ] Clase con una sola responsabilidad

**Frontend por componente:**
- [ ] Comentario de propósito en español
- [ ] Props con interface tipada
- [ ] Sin lógica de negocio en el componente
- [ ] Colores usan constantes de colors.ts
- [ ] Sin strings hardcodeados de rutas o URLs

---

## 📝 NOTAS DE SESIÓN

**Sesión 1 (completada):**
- Estructura base creada
- pom.xml actualizado con dependencias correctas
- application.yml configurado
- Frontend inicializado con Vite + React + TS
- Todas las dependencias npm instaladas
- TailwindCSS configurado
- Toda la estructura de carpetas y archivos stub creados
- Proyecto compila sin errores

**Próxima sesión — Fase 2: Dominio y modelos**
- Implementar enums: TrafficLightState, VehicleState, Direction, ExecutionMode
- Implementar value objects: Coordinate, Route, SimulationParams
- Implementar modelos: City, Intersection, Street, Vehicle, TrafficLight
- Verificar compilación del backend con `mvn compile`

---

*Simulador de Tráfico Urbano v1.0 — Programación Paralela y Concurrente*