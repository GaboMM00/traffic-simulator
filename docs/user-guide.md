# Guía de usuario

## Requisitos

- Java 21 o superior
- Maven 3.8 o superior
- Node.js 20 o superior
- Navegador moderno (Chrome, Firefox, Edge — versiones de 2023 en adelante)

---

## Instalación y arranque

### 1. Clonar o descargar el proyecto

Coloca el proyecto en cualquier directorio de tu máquina.

### 2. Iniciar el backend

```bash
cd backend/simulator
./mvnw spring-boot:run
```

En Windows usa `mvnw.cmd` si el script sin extensión no funciona:

```cmd
cd backend\simulator
mvnw.cmd spring-boot:run
```

Espera hasta ver en la consola:

```
Started SimulatorApplication in X.XXX seconds
```

El backend queda escuchando en `http://localhost:8080`.

### 3. Iniciar el frontend

En otra terminal:

```bash
cd frontend
npm install     # solo la primera vez
npm run dev
```

Abre el navegador en `http://localhost:5173`.

---

## Flujo de uso

### Pantalla de bienvenida

Al abrir la aplicación verás la pantalla de bienvenida con una animación introductoria. Haz click en **Empezar Simulación** para pasar a la configuración.

---

### Configuración de la simulación

Aquí defines cómo será la simulación antes de iniciarla.

#### Tamaño del grid

Controla el tamaño de la ciudad. Un grid de **12×12** (144 intersecciones) es el punto de equilibrio entre detalle visual y velocidad. Valores más grandes aumentan la complejidad y el tiempo de la simulación.

#### Cantidad de vehículos

El límite máximo se actualiza automáticamente al cambiar el tamaño del grid. Se muestra en el campo. Con más vehículos el speedup del modo paralelo es más pronunciado.

#### Semáforos

Define cuánto duran las fases del semáforo en milisegundos. Verdes cortos con muchos vehículos generan más esperas y congestión, lo que hace la simulación más interesante visualmente.

#### Velocidad

Controla qué tan rápido se mueven los vehículos. A 1× cada vehículo tarda 500ms por intersección recorrida. A 2× tarda 250ms. No afecta el cálculo del speedup.

#### Semáforos inteligentes

Cuando está activado, los semáforos detectan congestión y extienden su fase verde hasta 6 segundos adicionales para desahogar la cola. Observa el evento `TRAFFIC_LIGHT_EXTENDED` en el feed de eventos.

#### Presets

Usa los botones **Small**, **Medium** o **Large** para cargar una configuración predefinida si no quieres ajustar manualmente.

#### Vista previa del grid

El panel de la derecha muestra cómo se verá la cuadrícula con el tamaño seleccionado.

Cuando estés listo, haz click en **Iniciar Simulación**.

---

### Pantalla de simulación

Esta es la pantalla principal. Muestra dos paneles idénticos en layout, uno por cada modo.

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar: ID de simulación · Tiempo · Controles (⏸ ⏹)          │
├──────────────────────────┬──────────────────────┬──────────────┤
│  SEQUENTIAL              │  PARALLEL            │  Sidebar     │
│                          │                      │              │
│  Canvas con el mapa      │  Canvas con el mapa  │  Métricas    │
│  Vehículos de colores    │  Vehículos de colores│  Event feed  │
│  Semáforos (●)           │  Semáforos (●)       │              │
├──────────────────────────┴──────────────────────┴──────────────┤
│  BottomBar: timeline · eventos recientes                        │
└─────────────────────────────────────────────────────────────────┘
```

#### El mapa

- **Cuadrados de colores** → vehículos. Cada vehículo tiene un color fijo durante toda la simulación.
- **Círculo verde/amarillo/rojo** → semáforo en esa intersección.
- **Borde dorado** → el vehículo líder (el que llegó primero o tiene menor tiempo de viaje).
- Los vehículos se mueven en la dirección del flujo de tráfico de cada calle (unidireccional, patrón Manhattan alternado).

#### Estados de los vehículos

| Estado | Descripción |
|---|---|
| `CALCULATING` | Computando su ruta con A* |
| `MOVING` | Desplazándose por las calles |
| `WAITING` | Detenido por un semáforo en rojo |
| `COMPLETED` | Llegó a su destino |
| `NO_ROUTE` | No existe camino válido entre su origen y destino |

#### Controles durante la simulación

| Acción | Descripción |
|---|---|
| ⏸ Pausar | Congela ambas simulaciones simultáneamente |
| ▶ Reanudar | Reanuda desde el punto de pausa |
| ⏹ Detener | Finaliza la simulación y muestra resultados parciales |

También puedes hacer **zoom** con la rueda del mouse sobre cualquiera de los dos mapas, y **arrastrar** para desplazarte por el grid.

#### Sidebar — Métricas en tiempo real

- **Activos**: vehículos que aún están en movimiento o calculando ruta.
- **Completados**: llegaron a su destino.
- **Esperando**: detenidos en un semáforo en rojo.
- **Más congestionada**: intersección donde más vehículos han esperado.
- **Líder**: vehículo con menor tiempo de viaje hasta el momento.

#### Feed de eventos

Muestra los últimos 30 eventos. Los más importantes:

| Evento | Significado |
|---|---|
| `VEHICLE_ARRIVED` | Un vehículo llegó a su destino |
| `VEHICLE_WAITING` | Un vehículo lleva más de 5s esperando en un semáforo |
| `HIGH_CONGESTION` | Una intersección supera 5 vehículos esperando |
| `DEADLOCK_DETECTED` | El sistema detectó y resolvió un bloqueo circular |
| `TRAFFIC_LIGHT_EXTENDED` | Un semáforo inteligente extendió su fase verde |
| `ROUTE_CALCULATION_FINISHED` | El benchmark de routing finalizó (muestra speedup) |

---

### Finalización

Cuando todos los vehículos alcanzan el estado `COMPLETED` o `NO_ROUTE`, aparece un modal de notificación:

- **Ver resultados** → pasa a la pantalla de resultados.
- **Revisar mapa** → cierra el modal y puedes seguir observando el estado final del mapa.

---

### Pantalla de resultados

Muestra el análisis completo de la simulación.

#### Tarjetas de métricas (KPIs)

- Tiempo total de la simulación.
- Speedup del cálculo de rutas (T_secuencial / T_paralelo).
- Vehículos completados vs total.
- Tiempo promedio de viaje.
- Porcentaje de tiempo promedio esperando en semáforos.

#### Gráficos

| Gráfico | Qué muestra |
|---|---|
| Sequential vs Parallel | Barras comparando T_seq y T_par; línea de speedup |
| Travel Time Histogram | Distribución de tiempos de viaje de todos los vehículos |
| Completion Timeline | Cuándo llegó cada vehículo (orden de llegada) |
| Wait Time Pie | Proporción de tiempo de viaje vs tiempo esperando |
| Congestion Heatmap | Mapa de calor de la ciudad con las intersecciones más congestionadas |

#### Tabla de vehículos

Lista detallada con ID, estado, tiempo de viaje, tiempo de espera y porcentaje de espera de cada vehículo.

#### Exportar PDF

El botón **Exportar PDF** genera un reporte con todas las métricas, gráficos y tabla de vehículos en un archivo PDF descargable.

---

## Preguntas frecuentes

**¿Por qué algunos vehículos quedan en `NO_ROUTE`?**
El grafo de la ciudad es dirigido con sentido de circulación alternado (similar a calles de una vía). Ocasionalmente, el origen y destino aleatorios de un vehículo resultan en un par sin camino válido. El sistema lo detecta y marca el vehículo como `NO_ROUTE`.

**¿Por qué las dos simulaciones no terminan exactamente al mismo tiempo?**
Aunque reciben los mismos pares origen-destino, los locks de intersección y los tiempos de sleep tienen variabilidad inherente al scheduling del sistema operativo. Las diferencias son normales y esperadas.

**¿Qué indica el speedup en el evento `ROUTE_CALCULATION_FINISHED`?**
Es la razón T_secuencial / T_paralelo del benchmark de cálculo de rutas A*. Un speedup de 3.5× significa que el modo paralelo calculó las rutas 3.5 veces más rápido que el modo secuencial.

**¿El speedup varía entre ejecuciones?**
Sí. Depende de la carga del sistema operativo y del número de núcleos disponibles. El benchmark toma la mediana de 5 rondas para reducir la varianza, pero valores atípicos son posibles en máquinas con alta carga.

**¿Puedo aumentar el `broadcast-interval-ms` si la simulación va lenta?**
Sí. En `backend/simulator/src/main/resources/application.yml`, cambia `websocket.broadcast-interval-ms` de 100 a 200 o 250. Esto reduce la frecuencia de actualización del frontend y alivia la CPU.