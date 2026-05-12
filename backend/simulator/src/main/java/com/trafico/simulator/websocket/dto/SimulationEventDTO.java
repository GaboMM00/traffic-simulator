package com.trafico.simulator.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO para eventos discretos enviados por /topic/events.
 * Representa un suceso puntual que el frontend mostrará en el feed de eventos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationEventDTO {

    /** Tipo de evento: VEHICLE_ARRIVED, HIGH_CONGESTION, SIMULATION_FINISHED, etc. */
    private String type;

    /** Tiempo de simulación en ms cuando ocurrió el evento. */
    private long timestamp;

    /**
     * Payload con datos específicos del evento.
     * Por ejemplo: {vehicleId: "V-007", arrivalOrder: 1, travelTimeMs: 12400}
     */
    private Map<String, Object> payload;
}
