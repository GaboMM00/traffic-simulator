package com.trafico.simulator.config;

import com.trafico.simulator.simulation.sync.IntersectionLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de beans de infraestructura para la simulación.
 * Centraliza la creación de componentes que no son Spring beans por defecto.
 */
@Configuration
public class SimulationConfig {

    /** Intervalo en ms entre cada broadcast de world-state al frontend. */
    @Value("${websocket.broadcast-interval-ms:100}")
    private long broadcastIntervalMs;

    /** Intervalo en ms entre cada broadcast de métricas al frontend. */
    @Value("${websocket.metrics-interval-ms:500}")
    private long metricsIntervalMs;

    /**
     * Bean del gestor de locks por intersección.
     * Es singleton para que todos los VehicleThread compartan la misma instancia.
     *
     * @return instancia única de IntersectionLock
     */
    @Bean
    public IntersectionLock intersectionLock() {
        return new IntersectionLock();
    }
}
