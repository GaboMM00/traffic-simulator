package com.trafico.simulator.domain.enums;

/**
 * Estados posibles de un vehículo a lo largo de su ciclo de vida en la simulación.
 */
public enum VehicleState {

    /** El vehículo está calculando su ruta óptima al destino. */
    CALCULATING,

    /** El vehículo está moviéndose activamente por las calles. */
    MOVING,

    /** El vehículo está esperando en una intersección (semáforo rojo u otro vehículo). */
    WAITING,

    /** El vehículo llegó a su destino. Se excluye del canvas pero cuenta en métricas. */
    COMPLETED,

    /** No existe ruta válida al destino. El vehículo se excluye de todas las métricas. */
    NO_ROUTE
}
