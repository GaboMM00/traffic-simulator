# Frontend — Traffic Simulator

Aplicación React que visualiza en tiempo real las dos simulaciones de tráfico (secuencial y paralela) y muestra los resultados del benchmark al finalizar.

## Stack

- **React 19** + **TypeScript**
- **Vite** (build tool, puerto 5173 en desarrollo)
- **Tailwind CSS** (estilos)
- **Zustand** (state management)
- **Konva** / **react-konva** (canvas 2D para el mapa)
- **STOMP** + **SockJS** (WebSocket hacia el backend)
- **Recharts** (gráficos de resultados)
- **Framer Motion** (animaciones de transición)

## Comandos

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # build de producción en dist/
npm run preview   # previsualizar build de producción
npm run lint      # linting con ESLint
npm run test      # ejecutar tests con Vitest
```

## Estructura

```
src/
├── pages/          # 5 vistas: Welcome, Configuration, Loading, Simulation, Results
├── components/     # Componentes reutilizables (UI, Map, Charts)
├── services/       # api.service.ts (REST) · websocket.service.ts (STOMP)
├── store/          # Stores Zustand: simulation, config, ui
├── hooks/          # useSimulation, useWebSocket, useMetrics, useMapControls
├── types/          # Tipos TypeScript (WorldStateDTO, VehicleDTO, etc.)
├── constants/      # Endpoints, colores, valores por defecto
└── utils/          # Helpers de color, formato, exportación PDF
```

## Conexión con el backend

El frontend conecta al backend Spring Boot en `http://localhost:8080`.

**REST:** Para iniciar, pausar, reanudar y detener la simulación.

**WebSocket (STOMP):** Para recibir el estado del mundo cada 100ms:
- `/topic/world-state/seq` — Estado de la simulación secuencial
- `/topic/world-state/par` — Estado de la simulación paralela
- `/topic/events` — Eventos discretos (vehículo llegó, congestión, deadlock, etc.)

Consulta [API Reference](../docs/api-reference.md) para la especificación completa.

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL del backend |

Crear `.env.local` para sobrescribir en desarrollo local.