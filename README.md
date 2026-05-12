# Traffic Simulator

Simulador de tráfico urbano que compara el rendimiento de cálculo de rutas **secuencial vs paralelo** en tiempo real. Desarrollado como proyecto académico para la materia de Programación Paralela.

## Descripción

La aplicación simula una ciudad en cuadrícula donde múltiples vehículos calculan rutas con el algoritmo A* y se desplazan simultáneamente, respetando semáforos y evitando colisiones. Ejecuta **dos simulaciones idénticas en paralelo** —una con cálculo secuencial y otra con cálculo paralelo— para medir y comparar el speedup obtenido.

## Características principales

- Dos simulaciones lado a lado (secuencial vs paralelo) con los mismos parámetros
- Visualización en tiempo real vía WebSocket con canvas 2D (Konva)
- Algoritmo de enrutamiento A* con heurística Manhattan
- Detección y resolución automática de deadlocks
- Semáforos inteligentes con extensión dinámica de luz verde
- Métricas en tiempo real y reporte completo al finalizar con exportación a PDF
- Grid configurable de 8×8 a 20×20 con hasta 200 vehículos simultáneos

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 21, Spring Boot 3.2.5, WebSocket STOMP |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Visualización | Konva (canvas 2D), Recharts, Framer Motion |
| Estado | Zustand |
| Comunicación | REST + WebSocket (STOMP sobre SockJS) |
| Tests | JUnit 5, Awaitility (backend) · Vitest (frontend) |

## Estructura del proyecto

```
traffic-simulator/
├── backend/
│   └── simulator/          # Spring Boot (puerto 8080)
│       ├── src/main/java/com/trafico/simulator/
│       │   ├── domain/     # Modelos, enums, value objects
│       │   ├── simulation/ # Motor de simulación, hilos, routing
│       │   ├── metrics/    # Recolección de métricas
│       │   ├── event/      # Bus de eventos interno
│       │   ├── controller/ # REST endpoints
│       │   ├── websocket/  # Broadcaster y DTOs
│       │   └── config/     # Configuración Spring
│       └── src/test/       # 21 tests unitarios e integración
└── frontend/               # React + Vite (puerto 5173)
    └── src/
        ├── pages/          # 5 vistas (Welcome, Config, Loading, Simulation, Results)
        ├── components/     # Componentes reutilizables
        ├── services/       # Cliente API REST y WebSocket
        ├── store/          # Stores Zustand
        ├── hooks/          # Custom hooks
        └── types/          # Tipos TypeScript
```

## Instalación y ejecución

### Requisitos previos

- Java 21+
- Maven 3.8+
- Node.js 20+

### Backend

```bash
cd backend/simulator
./mvnw spring-boot:run
```

El servidor arranca en `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`.

### Ejecutar tests

```bash
# Backend
cd backend/simulator
./mvnw test

# Frontend
cd frontend
npm run test
```

## Uso rápido

1. Abre `http://localhost:5173`
2. Click en **Empezar Simulación**
3. Configura el tamaño del grid, cantidad de vehículos y parámetros de semáforos
4. Click en **Iniciar Simulación**
5. Observa las dos simulaciones en tiempo real
6. Al finalizar, revisa el reporte con métricas y gráficos

Consulta la [Guía de Usuario](docs/user-guide.md) para instrucciones detalladas.

## Documentación

| Documento | Contenido |
|---|---|
| [Arquitectura](docs/architecture.md) | Diseño del sistema, concurrencia, algoritmos |
| [API Reference](docs/api-reference.md) | Endpoints REST y mensajes WebSocket |
| [Configuración](docs/configuration.md) | Todos los parámetros configurables |
| [Guía de Usuario](docs/user-guide.md) | Instrucciones de uso paso a paso |

## Licencia

Este proyecto se distribuye bajo una licencia de evaluación no comercial. Consulta el archivo [LICENSE](LICENSE) para más información.

**Copyright © 2026 Gabriel Alejandro Medina Miramontes**