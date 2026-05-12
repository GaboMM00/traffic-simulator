package com.trafico.simulator.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO del estado completo del mundo enviado cada 100ms por /topic/world-state.
 * Es el mensaje más frecuente del sistema; contiene todo lo necesario para renderizar
 * el canvas en el frontend sin estado adicional.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorldStateDTO {

    /** Número de tick desde el inicio de la simulación. */
    private long tick;

    /** Tiempo de simulación en milisegundos desde el inicio. */
    private long simulationTimeMs;

    /** Lista de todos los vehículos activos (excluye COMPLETED). */
    private List<VehicleDTO> vehicles;

    /** Lista de todos los semáforos con su estado actual. */
    private List<TrafficLightDTO> trafficLights;

    /** Métricas resumidas del estado actual. */
    private MetricsDTO metrics;
}
