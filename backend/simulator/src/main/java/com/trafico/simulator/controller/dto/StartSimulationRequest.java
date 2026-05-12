package com.trafico.simulator.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body de POST /api/simulation/start.
 * Espeja el contrato definido en el prompt maestro y se mapea internamente a SimulationParams.
 * Los campos opcionales (originMode, destinationMode) se aceptan pero no afectan a la
 * generación actual: orígenes y destinos siempre son aleatorios en esta versión.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartSimulationRequest {

    /** Tamaño del grid cuadrado (8 a 20). */
    private Integer gridSize;

    /** Número de vehículos a simular (20 a 200). */
    private Integer vehicleCount;

    /** Modo de cálculo de rutas: "SEQUENTIAL" o "PARALLEL". */
    private String executionMode;

    /** Configuración temporal del semáforo. */
    private TrafficLightConfig trafficLight;

    /** Modo de origen ("RANDOM" o "MANUAL"). Aceptado por compatibilidad; siempre se usa RANDOM. */
    private String originMode;

    /** Modo de destino ("RANDOM" o "MANUAL"). Aceptado por compatibilidad; siempre se usa RANDOM. */
    private String destinationMode;

    /** Multiplicador de velocidad de la simulación (0.5 a 3.0). */
    private Double simulationSpeed;

    /** Si los semáforos pueden extender el verde por congestión. */
    private Boolean smartTrafficLights;

    /**
     * Configuración temporal anidada del semáforo (durations en milisegundos).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrafficLightConfig {
        private Long greenDurationMs;
        private Long yellowDurationMs;
        private Long redDurationMs;
    }
}
