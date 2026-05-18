package com.trafico.simulator.domain.valueobject;

import com.trafico.simulator.domain.enums.ExecutionMode;
import lombok.Builder;
import lombok.Value;

import java.util.List;

/**
 * Parámetros de configuración de una simulación.
 * Son inmutables: se establecen al iniciar y no cambian durante la ejecución.
 */
@Value
@Builder(toBuilder = true)
public class SimulationParams {

    /** Tamaño del grid cuadrado (número de intersecciones por lado). */
    int gridSize;

    /**
     * Número total de vehículos a simular.
     * En modo MANUAL este valor se sobreescribe automáticamente al tamaño de {@link #manualPairs}.
     */
    int vehicleCount;

    /** Modo de cálculo de rutas: SEQUENTIAL o PARALLEL. */
    ExecutionMode executionMode;

    /** Duración del estado VERDE en milisegundos. */
    long greenDurationMs;

    /** Duración del estado AMARILLO en milisegundos. */
    long yellowDurationMs;

    /** Duración del estado ROJO en milisegundos. */
    long redDurationMs;

    /** Multiplicador de velocidad de la simulación (0.5x a 3x). */
    double simulationSpeed;

    /** Si los semáforos pueden extender o reducir su fase actual según la demanda observada. */
    boolean smartTrafficLights;

    /**
     * Pares origen-destino definidos manualmente por el usuario.
     * Si es null o vacío, el simulador genera pares aleatorios (modo AUTOMÁTICO).
     * Si está poblado, el simulador usa exactamente estos pares (modo MANUAL).
     *
     * Cada elemento es un arreglo {@code Coordinate[2]} con {coordinate[0]=origen, coordinate[1]=destino}.
     */
    List<Coordinate[]> manualPairs;

    /**
     * Construye los parámetros por defecto para pruebas y la configuración estándar.
     *
     * @return parámetros con valores default del prompt maestro
     */
    public static SimulationParams defaults() {
        return SimulationParams.builder()
                .gridSize(12)
                .vehicleCount(50)
                .executionMode(ExecutionMode.PARALLEL)
                .greenDurationMs(5000)
                .yellowDurationMs(2000)
                .redDurationMs(6000)
                .simulationSpeed(1.0)
                .smartTrafficLights(false)
                .manualPairs(null)
                .build();
    }
}
