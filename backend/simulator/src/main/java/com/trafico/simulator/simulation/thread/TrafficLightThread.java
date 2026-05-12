package com.trafico.simulator.simulation.thread;

import com.trafico.simulator.domain.enums.TrafficLightState;
import com.trafico.simulator.domain.model.TrafficLight;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Hilo concurrente que gestiona el ciclo de estados de un semáforo.
 * Usa ScheduledExecutorService para garantizar precisión en los tiempos de cada fase.
 *
 * Ciclo normal: GREEN (greenDurationMs) → YELLOW (yellowDurationMs) → RED (redDurationMs) → GREEN...
 *
 * Con semáforos inteligentes activos: si la cola supera 5 vehículos al finalizar la fase verde,
 * el verde se extiende 2s adicionales, hasta un máximo de 3 extensiones por ciclo (6s extra).
 */
@Slf4j
public class TrafficLightThread {

    private static final long EXTENSION_MS  = 2_000L;
    private static final int  MAX_EXTENSIONS = 3;

    private final TrafficLight           trafficLight;
    private final SimulationParams       params;
    private final EventBus               eventBus;
    private final ScheduledExecutorService scheduler;

    /** Número de extensiones aplicadas en el ciclo actual. Reinicia con cada ciclo completo. */
    private int extensionsInCurrentCycle = 0;

    /**
     * Crea el hilo de semáforo con su scheduler dedicado.
     *
     * @param trafficLight semáforo a controlar
     * @param params       parámetros de simulación con duraciones configuradas
     * @param eventBus     bus de eventos para publicar TRAFFIC_LIGHT_EXTENDED
     * @param scheduler    executor programado para los cambios de estado
     */
    public TrafficLightThread(TrafficLight trafficLight, SimulationParams params,
                               EventBus eventBus, ScheduledExecutorService scheduler) {
        this.trafficLight = trafficLight;
        this.params       = params;
        this.eventBus     = eventBus;
        this.scheduler    = scheduler;
    }

    /**
     * Inicia el ciclo del semáforo programando la primera transición a VERDE.
     * Se llama una vez desde Simulator.start() por cada semáforo de la ciudad.
     */
    public void start() {
        log.debug("Semáforo {} iniciando ciclo", trafficLight.getIntersectionId());
        transitionToGreen();
    }

    /**
     * Detiene el semáforo cancelando todas las tareas programadas pendientes.
     */
    public void stop() {
        scheduler.shutdownNow();
    }

    // ──────────────────────────────────────────────────────────────
    // Transiciones de estado (programadas en el scheduler)
    // ──────────────────────────────────────────────────────────────

    private void transitionToGreen() {
        if (scheduler.isShutdown()) return;

        trafficLight.setState(TrafficLightState.GREEN);
        trafficLight.setExtended(false);
        extensionsInCurrentCycle = 0;
        trafficLight.setRemainingMs(params.getGreenDurationMs());

        log.trace("Semáforo {} → VERDE ({}ms)", trafficLight.getIntersectionId(), params.getGreenDurationMs());
        scheduler.schedule(this::onGreenEnd, params.getGreenDurationMs(), TimeUnit.MILLISECONDS);
    }

    /**
     * Al finalizar el verde: verifica si aplica extensión inteligente o transita a amarillo.
     */
    private void onGreenEnd() {
        if (scheduler.isShutdown()) return;

        boolean canExtend = params.isSmartTrafficLights()
                && trafficLight.isCongestedAbove(5)
                && extensionsInCurrentCycle < MAX_EXTENSIONS;

        if (canExtend) {
            extensionsInCurrentCycle++;
            trafficLight.setExtended(true);
            trafficLight.setRemainingMs(EXTENSION_MS);

            log.debug("Semáforo {} extiende verde (extensión #{}/{})",
                    trafficLight.getIntersectionId(), extensionsInCurrentCycle, MAX_EXTENSIONS);

            eventBus.publish(SimulationEvent.builder()
                    .type(SimulationEventType.TRAFFIC_LIGHT_EXTENDED)
                    .timestamp(System.currentTimeMillis())
                    .payload(Map.of(
                            "intersectionId",     trafficLight.getIntersectionId(),
                            "extensionNumber",    extensionsInCurrentCycle,
                            "queueSize",          trafficLight.getQueueSize().get()
                    ))
                    .build());

            scheduler.schedule(this::onGreenEnd, EXTENSION_MS, TimeUnit.MILLISECONDS);
        } else {
            transitionToYellow();
        }
    }

    private void transitionToYellow() {
        if (scheduler.isShutdown()) return;

        trafficLight.setState(TrafficLightState.YELLOW);
        trafficLight.setExtended(false);
        trafficLight.setRemainingMs(params.getYellowDurationMs());

        log.trace("Semáforo {} → AMARILLO ({}ms)", trafficLight.getIntersectionId(), params.getYellowDurationMs());
        scheduler.schedule(this::transitionToRed, params.getYellowDurationMs(), TimeUnit.MILLISECONDS);
    }

    private void transitionToRed() {
        if (scheduler.isShutdown()) return;

        trafficLight.setState(TrafficLightState.RED);
        trafficLight.setRemainingMs(params.getRedDurationMs());

        log.trace("Semáforo {} → ROJO ({}ms)", trafficLight.getIntersectionId(), params.getRedDurationMs());
        scheduler.schedule(this::transitionToGreen, params.getRedDurationMs(), TimeUnit.MILLISECONDS);
    }
}
