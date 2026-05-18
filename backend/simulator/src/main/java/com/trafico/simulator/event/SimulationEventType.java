package com.trafico.simulator.event;

/**
 * Tipos de eventos discretos que pueden ocurrir durante la simulación.
 * Cada tipo tiene una representación visual específica en el feed de eventos del frontend.
 */
public enum SimulationEventType {

    /** Un vehículo llegó exitosamente a su destino. */
    VEHICLE_ARRIVED,

    /** Un vehículo lleva más de 5 segundos esperando en una intersección. */
    VEHICLE_WAITING,

    /** Una intersección superó 5 vehículos en cola simultánea. */
    HIGH_CONGESTION,

    /** Todos los vehículos completaron su viaje: la simulación terminó. */
    SIMULATION_FINISHED,

    /** Se detectó y resolvió un deadlock entre vehículos. */
    DEADLOCK_DETECTED,

    /** Un semáforo inteligente extendió su fase verde por congestión. */
    TRAFFIC_LIGHT_EXTENDED,

    /**
     * Un semáforo inteligente redujo su fase actual por demanda:
     *   - Verde reducido si la cola se vació antes de terminar el verde
     *   - Rojo reducido si la cola superó el umbral crítico (8 vehículos)
     */
    TRAFFIC_LIGHT_REDUCED,

    /** El primer vehículo empieza a calcular su ruta (inicio de la fase de cálculo). */
    ROUTE_CALCULATION_STARTED,

    /** El último vehículo terminó de calcular su ruta (todos listos para moverse). */
    ROUTE_CALCULATION_FINISHED
}
