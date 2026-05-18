package com.trafico.simulator.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body de POST /api/simulation/start.
 * Espeja el contrato definido en el prompt maestro y se mapea internamente a SimulationParams.
 *
 * Modos de generación de vehículos:
 * <ul>
 *   <li><b>AUTOMÁTICO</b>: el frontend manda {@code vehicleCount} y deja {@code manualVehicles}
 *       en null o vacío. El backend genera pares origen-destino aleatorios en los bordes.</li>
 *   <li><b>MANUAL</b>: el frontend manda {@code manualVehicles} con la lista completa de
 *       pares origen-destino. {@code vehicleCount} se ignora y se deriva de la lista.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartSimulationRequest {

    /** Tamaño del grid cuadrado (8 a 20). */
    private Integer gridSize;

    /** Número de vehículos a simular en modo automático (20 a 200). Ignorado si {@link #manualVehicles} viene poblado. */
    private Integer vehicleCount;

    /** Modo de cálculo de rutas: "SEQUENTIAL" o "PARALLEL". */
    private String executionMode;

    /** Configuración temporal del semáforo. */
    private TrafficLightConfig trafficLight;

    /** Modo de origen ("RANDOM" o "MANUAL"). Aceptado por compatibilidad; el modo real se infiere de {@link #manualVehicles}. */
    private String originMode;

    /** Modo de destino ("RANDOM" o "MANUAL"). Aceptado por compatibilidad; el modo real se infiere de {@link #manualVehicles}. */
    private String destinationMode;

    /** Multiplicador de velocidad de la simulación (0.5 a 3.0). */
    private Double simulationSpeed;

    /** Si los semáforos pueden extender o reducir su fase actual según la cola observada. */
    private Boolean smartTrafficLights;

    /**
     * Lista de vehículos definidos manualmente por el usuario.
     * Si está poblada (no null y no vacía), activa el modo MANUAL: el backend usa estos
     * pares en lugar de generar aleatorios, y {@link #vehicleCount} se ignora.
     */
    private List<ManualVehiclePair> manualVehicles;

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

    /**
     * Par origen-destino definido manualmente por el usuario en la pantalla de configuración.
     * El origen DEBE ser una intersección del borde; el destino puede ser cualquier intersección
     * distinta del origen. La validación final se hace en el controller.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualVehiclePair {
        private Integer originCol;
        private Integer originRow;
        private Integer destCol;
        private Integer destRow;
    }
}
