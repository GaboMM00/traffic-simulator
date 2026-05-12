package com.trafico.simulator.event;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

/**
 * Evento discreto emitido durante la simulación.
 * Se publica en el EventBus y se envía al frontend vía /topic/events.
 * El payload contiene datos específicos según el tipo de evento.
 */
@Value
@Builder
public class SimulationEvent {

    /** Tipo de evento ocurrido. */
    SimulationEventType type;

    /** Tiempo de simulación en ms en el que ocurrió el evento. */
    long timestamp;

    /**
     * Datos específicos del evento.
     * Por ejemplo, para VEHICLE_ARRIVED: {vehicleId, arrivalOrder, travelTimeMs}.
     */
    Map<String, Object> payload;

    /**
     * Crea un evento simple sin payload adicional.
     *
     * @param type      tipo de evento
     * @param timestamp tiempo de simulación
     * @return evento sin payload
     */
    public static SimulationEvent of(SimulationEventType type, long timestamp) {
        return SimulationEvent.builder()
                .type(type)
                .timestamp(timestamp)
                .payload(Map.of())
                .build();
    }
}
