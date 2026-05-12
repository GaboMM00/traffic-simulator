package com.trafico.simulator.domain.enums;

/**
 * Modo de ejecución del cálculo de rutas.
 * Permite comparar el rendimiento entre ejecución secuencial y paralela.
 */
public enum ExecutionMode {

    /** Calcula todas las rutas de forma secuencial en un solo hilo. */
    SEQUENTIAL,

    /** Calcula las rutas en paralelo usando ForkJoinPool. */
    PARALLEL
}
