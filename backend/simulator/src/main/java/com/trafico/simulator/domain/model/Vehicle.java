package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.Direction;
import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;
import lombok.Getter;
import lombok.Setter;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Modelo de dominio de un vehículo en la simulación.
 * El estado de posición y movimiento es mutable porque VehicleThread lo actualiza en cada paso.
 * Las métricas de tiempo acumuladas usan AtomicLong para garantizar thread-safety
 * cuando MetricsCollector las lee concurrentemente con VehicleThread.
 */
@Getter
public class Vehicle {

    /** Identificador único en formato "V-{número con 3 dígitos}", por ejemplo "V-007". */
    private final String id;

    /** Índice de color en la paleta vehicleColors (0-9). Se asigna al crear el vehículo. */
    private final int colorIndex;

    /**
     * Coordenada actual en el grid.
     * Volatile para visibilidad inmediata entre VehicleThread y SimulationBroadcaster.
     */
    @Setter
    private volatile Coordinate currentPosition;

    /**
     * Coordenada de la posición anterior.
     * Permite al frontend calcular la dirección visual y renderizar el trail.
     */
    @Setter
    private volatile Coordinate previousPosition;

    /** Dirección actual de movimiento (NORTH, SOUTH, EAST, WEST). */
    @Setter
    private volatile Direction direction;

    /**
     * Estado actual en el ciclo de vida.
     * AtomicReference para cambios de estado thread-safe sin synchronized.
     */
    private final AtomicReference<VehicleState> state = new AtomicReference<>(VehicleState.CALCULATING);

    /**
     * Coordenada de destino. Se asigna al crear el vehículo y la usa VehicleThread
     * para calcular su propia ruta en tiempo real durante la simulación.
     */
    @Setter
    private volatile Coordinate destination;

    /** Ruta calculada al destino (secuencia de coordenadas a recorrer). */
    @Setter
    private volatile Route route;

    /** Tiempo de inicio del viaje en milisegundos de simulación (reloj de simulación, no real). */
    private final long startTimeMs;

    /**
     * Tiempo acumulado en estado WAITING (esperando semáforos o intersecciones ocupadas).
     * AtomicLong para sumas concurrentes desde VehicleThread sin bloquear al broadcaster.
     */
    private final AtomicLong waitTimeMs = new AtomicLong(0);

    /**
     * Tiempo total de viaje cuando el vehículo llega a su destino.
     * Calculado por VehicleThread al publicar VEHICLE_ARRIVED.
     */
    @Setter
    private volatile long travelTimeMs;

    /**
     * Orden de llegada al destino (1 = primero en llegar).
     * -1 indica que el vehículo aún no ha completado su viaje.
     */
    @Setter
    private volatile int arrivalOrder = -1;

    /**
     * Crea un vehículo con ID y color asignados, listo para iniciar en estado CALCULATING.
     *
     * @param id          identificador único del vehículo
     * @param colorIndex  índice de color en la paleta (0-9)
     * @param startTimeMs tiempo de inicio en milisegundos de simulación
     */
    public Vehicle(String id, int colorIndex, long startTimeMs) {
        this.id = id;
        this.colorIndex = colorIndex;
        this.startTimeMs = startTimeMs;
    }

    /**
     * Actualiza el estado del vehículo de forma thread-safe.
     *
     * @param newState nuevo estado a establecer
     */
    public void setState(VehicleState newState) {
        state.set(newState);
    }

    /**
     * Obtiene el estado actual del vehículo.
     *
     * @return estado actual
     */
    public VehicleState getState() {
        return state.get();
    }

    /**
     * Acumula tiempo de espera al total del vehículo.
     * Se llama desde VehicleThread cada vez que el vehículo espera en una intersección.
     *
     * @param milliseconds milisegundos adicionales de espera
     */
    public void addWaitTime(long milliseconds) {
        waitTimeMs.addAndGet(milliseconds);
    }

    /**
     * Calcula el porcentaje de tiempo de espera sobre el tiempo total de viaje.
     * Se invoca al finalizar la simulación para las métricas de resultados.
     *
     * @return porcentaje de espera (0.0 a 100.0), o 0.0 si el viaje no duró nada
     */
    public double getWaitTimePercent() {
        if (travelTimeMs == 0) return 0.0;
        return (waitTimeMs.get() * 100.0) / travelTimeMs;
    }

    /**
     * Indica si el vehículo es actualmente el líder de la simulación.
     * El líder es el vehículo COMPLETADO con el menor tiempo de viaje total.
     *
     * @return true si este vehículo tiene el badge de primer lugar
     */
    public boolean isLeader() {
        return arrivalOrder == 1;
    }

    /**
     * Indica si el vehículo completó su viaje con éxito.
     *
     * @return true si el estado es COMPLETED
     */
    public boolean isCompleted() {
        return state.get() == VehicleState.COMPLETED;
    }

    /**
     * Indica si el vehículo no pudo calcular una ruta al destino.
     *
     * @return true si el estado es NO_ROUTE
     */
    public boolean hasNoRoute() {
        return state.get() == VehicleState.NO_ROUTE;
    }
}
