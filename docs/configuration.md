# Configuración

## Parámetros de simulación

Todos los parámetros se configuran en la pantalla de configuración antes de iniciar la simulación.

### Grid

| Parámetro | Tipo | Rango | Default | Descripción |
|---|---|---|---|---|
| `gridSize` | `int` | 8–20 | 12 | Tamaño de la ciudad en intersecciones (gridSize × gridSize) |

El número de semáforos se calcula automáticamente como `ceil(gridSize / 4)²`. Para grid 12×12 resultan 16 semáforos distribuidos uniformemente.

El número **máximo de vehículos** se limita a `min(200, gridSize² × 0.4)` para evitar saturación. La API `/configuration/max-vehicles?gridSize=X` devuelve este valor en tiempo real.

| Grid | Intersecciones | Semáforos | Máx. vehículos |
|---|---|---|---|
| 8×8 | 64 | 4 | 25 |
| 10×10 | 100 | 9 | 40 |
| 12×12 | 144 | 16 | 57 |
| 16×16 | 256 | 16 | 102 |
| 20×20 | 400 | 25 | 160 |

---

### Vehículos

| Parámetro | Tipo | Rango | Default | Descripción |
|---|---|---|---|---|
| `vehicleCount` | `int` | 1–maxVehicles | 50 | Número de vehículos que participan en la simulación |

Cada vehículo recibe un origen y destino aleatorios en el borde del grid. Los pares origen-destino son **idénticos** para ambas simulaciones (secuencial y paralela) para garantizar comparación justa.

---

### Semáforos

| Parámetro | Tipo | Mínimo | Default | Descripción |
|---|---|---|---|---|
| `greenDurationMs` | `int` | 1000 | 5000 | Duración de la fase verde en ms |
| `yellowDurationMs` | `int` | 500 | 2000 | Duración de la fase amarilla en ms |
| `redDurationMs` | `int` | 1000 | 6000 | Duración de la fase roja en ms |

El ciclo completo es: GREEN → YELLOW → RED → GREEN.

**Recomendaciones:**
- Para simulaciones rápidas con pocos vehículos: verdes cortos (2000–3000ms).
- Para observar congestión: verdes cortos con muchos vehículos.
- Para observar semáforos inteligentes: habilitar `smartTrafficLights` con muchos vehículos.

---

### Velocidad de simulación

| Parámetro | Tipo | Rango | Default | Descripción |
|---|---|---|---|---|
| `simulationSpeed` | `double` | 0.5–3.0 | 1.0 | Multiplicador de velocidad de movimiento de vehículos |

La velocidad afecta el tiempo de sleep entre pasos de cada vehículo:

```
stepDelayMs = 500ms / simulationSpeed
```

| Velocidad | Delay entre pasos |
|---|---|
| 0.5× | 1000ms |
| 1.0× (normal) | 500ms |
| 2.0× | 250ms |
| 3.0× | ~166ms |

La velocidad se puede cambiar durante una simulación en curso.

---

### Semáforos inteligentes

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `smartTrafficLights` | `boolean` | false | Activa extensión dinámica del verde cuando hay congestión |

Cuando está activado, al finalizar la fase verde, si la cola de vehículos esperando supera **5**, el semáforo extiende el verde **2 segundos adicionales**. Máximo **3 extensiones por ciclo** (6s extra total).

El evento `TRAFFIC_LIGHT_EXTENDED` se emite cada vez que ocurre una extensión.

---

## Presets disponibles

El frontend ofrece tres presets para configuración rápida:

### Small
```json
{
  "gridSize": 8,
  "vehicleCount": 20,
  "trafficLight": { "greenDurationMs": 4000, "yellowDurationMs": 1500, "redDurationMs": 5000 },
  "simulationSpeed": 1.5,
  "smartTrafficLights": false
}
```
Ideal para ver el comportamiento básico rápidamente.

### Medium (recomendado)
```json
{
  "gridSize": 12,
  "vehicleCount": 50,
  "trafficLight": { "greenDurationMs": 5000, "yellowDurationMs": 2000, "redDurationMs": 6000 },
  "simulationSpeed": 1.0,
  "smartTrafficLights": true
}
```
Balance entre detalle visual y rendimiento del benchmark.

### Large
```json
{
  "gridSize": 20,
  "vehicleCount": 160,
  "trafficLight": { "greenDurationMs": 3000, "yellowDurationMs": 1000, "redDurationMs": 4000 },
  "simulationSpeed": 2.0,
  "smartTrafficLights": true
}
```
Para medir el speedup máximo del cálculo paralelo. Requiere máquina con varios núcleos.

---

## Configuración del servidor (application.yml)

```yaml
server:
  port: 8080

spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173"

websocket:
  broadcast-interval-ms: 100     # Frecuencia de actualización del world-state
  metrics-interval-ms: 500        # Frecuencia de actualización de métricas snapshot

logging:
  level:
    com.trafico.simulator: DEBUG
```

Para cambiar el origen CORS permitido (por ejemplo en producción), modificar `allowed-origins`.

Para reducir el uso de CPU en máquinas lentas, incrementar `broadcast-interval-ms` a 200 o 250.

---

## Variables de entorno del frontend

El frontend usa la variable de entorno `VITE_API_BASE_URL` para apuntar al backend. Por defecto está configurada en `http://localhost:8080/api`.

Para desarrollo:
```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:8080/api
```

Para producción con dominio distinto, crear un `.env.production` con el URL correspondiente.