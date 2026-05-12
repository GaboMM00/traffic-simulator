# API Reference

Base URL: `http://localhost:8080/api`

---

## REST API

### Simulación

#### POST /simulation/start

Inicia una nueva simulación dual (secuencial + paralela).

**Request body:**
```json
{
  "gridSize": 12,
  "vehicleCount": 50,
  "trafficLight": {
    "greenDurationMs": 5000,
    "yellowDurationMs": 2000,
    "redDurationMs": 6000
  },
  "simulationSpeed": 1.0,
  "smartTrafficLights": false
}
```

**Response `200 OK`:**
```json
{
  "simulationId": "SIM-1715000000000",
  "status": "RUNNING",
  "trafficLightCount": 16,
  "estimatedLoadTimeMs": 800
}
```

**Errores:**
- `409 Conflict` — Ya hay una simulación en curso.
- `400 Bad Request` — Parámetros fuera de rango.

---

#### POST /simulation/pause

Pausa las dos simulaciones activas. No acepta body.

**Response `200 OK`:**
```json
{ "status": "PAUSED" }
```

**Errores:**
- `409 Conflict` — No hay simulación en curso o ya está pausada.

---

#### POST /simulation/resume

Reanuda una simulación pausada. No acepta body.

**Response `200 OK`:**
```json
{ "status": "RUNNING" }
```

---

#### POST /simulation/stop

Detiene las simulaciones y devuelve los resultados completos.

**Response `200 OK`:**
```json
{
  "simulationId": "SIM-1715000000000",
  "totalDurationMs": 45200,
  "routeCalculation": {
    "sequentialTimeMs": 87,
    "parallelTimeMs": 23,
    "speedup": 3.78
  },
  "sequential": {
    "durationMs": 43100,
    "vehicles": [
      {
        "id": "V-001",
        "state": "COMPLETED",
        "travelTimeMs": 12400,
        "waitTimeMs": 3200,
        "waitTimePercent": 25.8,
        "isLeader": true
      }
    ],
    "summary": {
      "firstVehicleId": "V-001",
      "firstVehicleTravelTimeMs": 12400,
      "averageTravelTimeMs": 28500,
      "averageWaitTimeMs": 7100,
      "averageWaitTimePercent": 24.9,
      "totalCompleted": 48,
      "totalVehicles": 50,
      "mostCongestedIntersectionId": "I-6-4",
      "mostCongestedIntersectionWaits": 142
    }
  },
  "parallel": {
    "durationMs": 44300,
    "vehicles": [...],
    "summary": {...}
  }
}
```

---

#### GET /simulation/status

Retorna el estado actual de la simulación.

**Response `200 OK`:**
```json
{
  "status": "RUNNING"
}
```

Valores posibles de `status`: `IDLE`, `RUNNING`, `PAUSED`, `STOPPED`.

---

### Configuración

#### GET /configuration/max-vehicles

Calcula el número máximo de vehículos permitido para un tamaño de grid dado.

**Query params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `gridSize` | `int` | Tamaño del grid (8–20) |

**Response `200 OK`:**
```json
{
  "maxVehicles": 57
}
```

Fórmula: `min(200, gridSize² × 0.4)`.

---

#### GET /configuration/defaults

Devuelve los valores por defecto para iniciar una simulación.

**Response `200 OK`:**
```json
{
  "gridSize": 12,
  "vehicleCount": 50,
  "trafficLight": {
    "greenDurationMs": 5000,
    "yellowDurationMs": 2000,
    "redDurationMs": 6000
  },
  "simulationSpeed": 1.0,
  "smartTrafficLights": false
}
```

---

## WebSocket

**Endpoint de conexión:** `ws://localhost:8080/ws` (SockJS con fallback HTTP)

**Protocolo:** STOMP

### Conexión

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    client.subscribe('/topic/world-state/seq', (msg) => { ... });
    client.subscribe('/topic/world-state/par', (msg) => { ... });
    client.subscribe('/topic/events', (msg) => { ... });
  }
});
client.activate();
```

---

### Topic: `/topic/world-state/seq` y `/topic/world-state/par`

Publicado cada **100ms**. Contiene el estado completo de la simulación en un instante.

```typescript
interface WorldStateDTO {
  tick: number;                    // Número de frame
  simulationTimeMs: number;        // Tiempo de simulación en ms
  vehicles: VehicleDTO[];
  trafficLights: TrafficLightDTO[];
  metrics: MetricsDTO;
}

interface VehicleDTO {
  id: string;                      // "V-001"
  col: number;                     // Columna actual (0 a gridSize-1)
  row: number;                     // Fila actual
  prevCol: number;                 // Columna anterior (para interpolación)
  prevRow: number;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  state: 'CALCULATING' | 'MOVING' | 'WAITING' | 'COMPLETED' | 'NO_ROUTE';
  colorIndex: number;              // 0-9, índice en paleta de colores
  isLeader: boolean;               // True si tiene el menor travelTimeMs
  travelTimeMs: number;
  waitTimeMs: number;
}

interface TrafficLightDTO {
  intersectionId: string;          // "I-6-4"
  col: number;
  row: number;
  state: 'GREEN' | 'YELLOW' | 'RED';
  remainingMs: number;             // Ms restantes en la fase actual
  queueSize: number;               // Vehículos esperando en esta luz
  isExtended: boolean;             // True si el semáforo inteligente extendió el verde
}

interface MetricsDTO {
  activeVehicles: number;
  completedVehicles: number;
  waitingVehicles: number;
  mostCongestedIntersectionId: string | null;
  leaderId: string | null;
  averageTravelTimeMs: number;
}
```

---

### Topic: `/topic/events`

Publicado cuando ocurren eventos discretos durante la simulación. El mensaje contiene un array de eventos acumulados desde el último envío.

```typescript
interface SimulationEventDTO {
  type: EventType;
  timestamp: number;               // Tiempo de simulación en ms
  payload: Record<string, unknown>;
}

type EventType =
  | 'VEHICLE_ARRIVED'
  | 'VEHICLE_WAITING'
  | 'HIGH_CONGESTION'
  | 'SIMULATION_FINISHED'
  | 'DEADLOCK_DETECTED'
  | 'TRAFFIC_LIGHT_EXTENDED'
  | 'ROUTE_CALCULATION_STARTED'
  | 'ROUTE_CALCULATION_FINISHED';
```

**Payloads por tipo de evento:**

| Tipo | Campos del payload |
|---|---|
| `VEHICLE_ARRIVED` | `vehicleId`, `travelTimeMs`, `waitTimeMs`, `arrivalOrder`, `mode` |
| `VEHICLE_WAITING` | `vehicleId`, `waitTimeMs`, `intersectionId` |
| `HIGH_CONGESTION` | `intersectionId`, `waitCount` |
| `DEADLOCK_DETECTED` | `victimId`, `cycleLength` |
| `TRAFFIC_LIGHT_EXTENDED` | `intersectionId`, `queueSize`, `extensionCount` |
| `ROUTE_CALCULATION_FINISHED` | `seqTimeMs`, `parTimeMs`, `speedup`, `sampleSize` |
| `SIMULATION_FINISHED` | `mode`, `totalVehicles`, `completedVehicles` |

---

## Tipos compartidos

### SimulationParams

```typescript
interface SimulationParams {
  gridSize: number;         // 8–20
  vehicleCount: number;     // 1–maxVehicles
  trafficLight: {
    greenDurationMs: number;   // >= 1000
    yellowDurationMs: number;  // >= 500
    redDurationMs: number;     // >= 1000
  };
  simulationSpeed: number;  // 0.5–3.0
  smartTrafficLights: boolean;
}
```

### Paleta de colores de vehículos

Los 10 colores se asignan por `colorIndex % 10`:

| Índice | Color hex |
|---|---|
| 0 | `#FF6B6B` |
| 1 | `#4ECDC4` |
| 2 | `#45B7D1` |
| 3 | `#FFA07A` |
| 4 | `#98D8C8` |
| 5 | `#F7DC6F` |
| 6 | `#BB8FCE` |
| 7 | `#85C1E2` |
| 8 | `#F8B88B` |
| 9 | `#95E1D3` |