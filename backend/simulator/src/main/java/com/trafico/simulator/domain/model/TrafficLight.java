package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.TrafficLightState;
import lombok.Getter;
import lombok.Setter;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Modelo de dominio de un semáforo.
 * El estado cambia en TrafficLightThread; esta clase solo almacena el estado actual.
 * El tamaño de cola se consulta desde múltiples hilos de vehículos (thread-safe).
 */
@Getter
public class TrafficLight {

    /** ID de la intersección donde está ubicado este semáforo. */
    private final String intersectionId;

    /** Estado actual del semáforo (GREEN, YELLOW, RED). */
    private final AtomicReference<TrafficLightState> state =
            new AtomicReference<>(TrafficLightState.RED);

    /** Milisegundos restantes en el estado actual (actualizado por TrafficLightThread). */
    @Setter
    private volatile long remainingMs;

    /** Cantidad de vehículos actualmente esperando en esta intersección. */
    private final AtomicInteger queueSize = new AtomicInteger(0);

    /** Indica si el semáforo está en modo extendido (semáforo inteligente activo). */
    @Setter
    private volatile boolean extended;

    /**
     * Indica si el semáforo redujo activamente la fase actual por demanda inteligente.
     * Se activa cuando el algoritmo reduce verde (cola==0) o reduce rojo (cola>8).
     */
    @Setter
    private volatile boolean reduced;

    /**
     * Crea un semáforo para la intersección indicada, iniciando en estado ROJO.
     *
     * @param intersectionId identificador de la intersección
     */
    public TrafficLight(String intersectionId) {
        this.intersectionId = intersectionId;
    }

    /**
     * Actualiza el estado del semáforo de forma thread-safe.
     *
     * @param newState nuevo estado del semáforo
     */
    public void setState(TrafficLightState newState) {
        state.set(newState);
    }

    /**
     * Obtiene el estado actual del semáforo.
     *
     * @return estado actual
     */
    public TrafficLightState getState() {
        return state.get();
    }

    /**
     * Incrementa la cola de espera cuando un vehículo llega a esta intersección.
     */
    public void incrementQueue() {
        queueSize.incrementAndGet();
    }

    /**
     * Decrementa la cola de espera cuando un vehículo cruza o se va.
     */
    public void decrementQueue() {
        queueSize.decrementAndGet();
    }

    /**
     * Indica si el semáforo permite el paso de vehículos en este momento.
     * Solo el estado GREEN permite avanzar; YELLOW y RED obligan a esperar.
     *
     * @return true si el semáforo está en verde
     */
    public boolean allowsTraffic() {
        return state.get() == TrafficLightState.GREEN;
    }

    /**
     * Verifica si la cola supera el umbral de activación del semáforo inteligente.
     * Si la cola supera 5 vehículos y los semáforos inteligentes están activos,
     * TrafficLightThread puede extender la fase verde hasta 6s extra.
     *
     * @param threshold umbral de congestión (normalmente 5)
     * @return true si la cola supera el umbral
     */
    public boolean isCongestedAbove(int threshold) {
        return queueSize.get() > threshold;
    }
}
