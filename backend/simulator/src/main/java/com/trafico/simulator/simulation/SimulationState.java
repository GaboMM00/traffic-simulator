package com.trafico.simulator.simulation;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Estado compartido y thread-safe de la simulación en ejecución.
 * Utiliza estructuras concurrentes para garantizar consistencia entre hilos.
 * Es el único punto de verdad sobre el estado actual de la simulación.
 */
@Component
@Getter
public class SimulationState {

    /** ID de la simulación activa. Null si no hay ninguna. */
    @Setter
    private volatile String simulationId;

    /** Parámetros con los que se inició la simulación actual. */
    @Setter
    private volatile SimulationParams params;

    /** Ciudad actualmente en uso por la simulación. */
    @Setter
    private volatile City city;

    /** Indica si la simulación está activa y corriendo. */
    @Setter
    private volatile boolean running;

    /** Indica si la simulación está en pausa. */
    @Setter
    private volatile boolean paused;

    /** Número total de vehículos que han completado su viaje. */
    private final AtomicInteger completedVehicles = new AtomicInteger(0);

    /** Número de vehículos actualmente esperando en intersecciones. */
    private final AtomicInteger waitingVehicles = new AtomicInteger(0);

    /** Tick actual de la simulación (incrementa en cada broadcast). */
    private final AtomicLong tick = new AtomicLong(0);

    /** Tiempo de simulación en milisegundos desde el inicio. */
    private final AtomicLong simulationTimeMs = new AtomicLong(0);

    /** Tiempo que tomó calcular todas las rutas en modo secuencial (para comparación). */
    @Setter
    private volatile long sequentialRouteTimeMs;

    /** Tiempo que tomó calcular todas las rutas en modo paralelo (para comparación). */
    @Setter
    private volatile long parallelRouteTimeMs;

    /**
     * Tiempo en nanosegundos del benchmark secuencial (mayor precisión).
     * Se usa para reportar µs/ms según magnitud cuando el cómputo es sub-milisegundo
     * (grids pequeños donde A* sobre 50 nodos cuesta cientos de microsegundos).
     */
    @Setter
    private volatile long sequentialRouteTimeNs;

    /** Tiempo en nanosegundos del benchmark paralelo (mayor precisión). */
    @Setter
    private volatile long parallelRouteTimeNs;

    /** Todos los vehículos de la simulación, indexados por ID. */
    private final Map<String, Vehicle> vehicles = new ConcurrentHashMap<>();

    /** Número de vehículos que no pudieron calcular una ruta (estado NO_ROUTE). */
    private final AtomicInteger noRouteVehicleCount = new AtomicInteger(0);

    /**
     * Número de vehículos que ya terminaron la fase de cálculo de ruta (CALCULATING → siguiente estado).
     * Se usa para saber cuándo el último vehículo terminó de calcular y publicar ROUTE_CALCULATION_FINISHED.
     */
    private final AtomicInteger routesCalculated = new AtomicInteger(0);

    /** Total de extensiones de verde aplicadas por los semáforos inteligentes durante la simulación. */
    private final AtomicInteger totalGreenExtensions = new AtomicInteger(0);

    /** Total de reducciones de verde aplicadas (cuando la cola se vació antes de terminar el verde). */
    private final AtomicInteger totalGreenReductions = new AtomicInteger(0);

    /** Total de reducciones de rojo aplicadas (cuando la cola en rojo superó el umbral crítico). */
    private final AtomicInteger totalRedReductions = new AtomicInteger(0);

    /**
     * Reinicia el estado para una nueva simulación.
     * Se invoca antes de start() para limpiar el estado de la simulación anterior.
     */
    public void reset() {
        simulationId = null;
        params = null;
        city = null;
        running = false;
        paused = false;
        completedVehicles.set(0);
        waitingVehicles.set(0);
        tick.set(0);
        simulationTimeMs.set(0);
        sequentialRouteTimeMs = 0;
        parallelRouteTimeMs = 0;
        sequentialRouteTimeNs = 0;
        parallelRouteTimeNs = 0;
        vehicles.clear();
        noRouteVehicleCount.set(0);
        routesCalculated.set(0);
        totalGreenExtensions.set(0);
        totalGreenReductions.set(0);
        totalRedReductions.set(0);
    }
}
