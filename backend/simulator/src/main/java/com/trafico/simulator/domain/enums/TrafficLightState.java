package com.trafico.simulator.domain.enums;

/**
 * Estados posibles de un semáforo durante la simulación.
 * El ciclo normal es GREEN → YELLOW → RED → GREEN.
 */
public enum TrafficLightState {

    /** Semáforo en verde: los vehículos pueden cruzar la intersección. */
    GREEN,

    /** Semáforo en amarillo: los vehículos deben prepararse para detenerse. */
    YELLOW,

    /** Semáforo en rojo: los vehículos deben esperar. */
    RED
}
