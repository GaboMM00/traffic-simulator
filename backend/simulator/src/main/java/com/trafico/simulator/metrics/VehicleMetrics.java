package com.trafico.simulator.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Métricas finales de un vehículo individual al completar su viaje.
 * Se incluye en el reporte de resultados y en la exportación CSV/TXT.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleMetrics {

    /** ID del vehículo. */
    private String vehicleId;

    /** Orden de llegada al destino (1 = primero). */
    private int arrivalOrder;

    /** Tiempo total de viaje en milisegundos (desde start hasta llegada). */
    private long travelTimeMs;

    /** Tiempo acumulado esperando en semáforos, en milisegundos. */
    private long waitTimeMs;

    /** Porcentaje del tiempo de viaje que el vehículo estuvo esperando. */
    private double waitTimePercent;

    /** Cantidad de nodos en la ruta calculada. */
    private int routeLength;

    /** Indica si el vehículo completó su viaje o quedó con NO_ROUTE. */
    private boolean completed;
}
