package com.trafico.simulator.simulation.thread;

import com.trafico.simulator.domain.enums.TrafficLightState;
import com.trafico.simulator.domain.model.TrafficLight;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.SimulationState;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Hilo concurrente que gestiona el ciclo de estados de un semáforo.
 * Usa ScheduledExecutorService para garantizar precisión en los tiempos de cada fase.
 *
 * Ciclo normal: GREEN (greenDurationMs) → YELLOW (yellowDurationMs) → RED (redDurationMs) → GREEN...
 *
 * Algoritmo de semáforos inteligentes (cuando {@code params.isSmartTrafficLights() == true}):
 * <ul>
 *   <li><b>Extensión de verde</b>: al finalizar el verde, si la cola supera 5 vehículos, se
 *       extiende 2s adicionales. Máximo 3 extensiones por ciclo (6s extra).</li>
 *   <li><b>Reducción de verde</b>: un monitor periódico (cada {@link #MONITOR_INTERVAL_MS}ms)
 *       verifica si la cola se vació antes de terminar el verde. Si {@code queueSize == 0}
 *       después de un mínimo de {@link #MIN_GREEN_ELAPSED_MS}ms, recorta el tiempo restante
 *       a la mitad (mínimo {@link #MIN_REMAINING_MS}ms) para liberar el ciclo más rápido.
 *       Solo se aplica una reducción por ciclo verde.</li>
 *   <li><b>Reducción de rojo</b>: un monitor periódico verifica si la cola en rojo supera 8.
 *       Si es así, recorta 1s del tiempo restante (mínimo {@link #MIN_RED_REMAINING_MS}ms)
 *       para descongestionar más rápido. Solo se aplica una reducción por ciclo rojo.</li>
 * </ul>
 * Cada extensión/reducción incrementa el contador correspondiente en {@link SimulationState}
 * y publica un evento {@link SimulationEventType#TRAFFIC_LIGHT_EXTENDED} o
 * {@link SimulationEventType#TRAFFIC_LIGHT_REDUCED} para el feed del frontend.
 *
 * Respeta la pausa de la simulación: cuando {@link SimulationState#isPaused()} es true,
 * cada transición se re-agenda 100ms después sin cambiar el estado del semáforo.
 */
@Slf4j
public class TrafficLightThread {

    private static final long EXTENSION_MS         = 2_000L;
    private static final int  MAX_EXTENSIONS       = 3;
    /** Umbral de cola que activa la extensión de verde. */
    private static final int  EXTENSION_THRESHOLD  = 5;
    /** Umbral crítico de cola que activa la reducción de rojo. */
    private static final int  RED_REDUCE_THRESHOLD = 8;
    /** Reducción aplicada al rojo cuando hay congestión crítica. */
    private static final long RED_REDUCE_MS        = 1_000L;
    /** Mínimo de tiempo restante tras una reducción de verde. */
    private static final long MIN_REMAINING_MS     = 2_000L;
    /** Mínimo de tiempo restante tras una reducción de rojo. */
    private static final long MIN_RED_REMAINING_MS = 3_000L;
    /** Tiempo mínimo que debe llevar la fase verde antes de poder reducirla. */
    private static final long MIN_GREEN_ELAPSED_MS = 1_000L;
    /** Intervalo del monitor reactivo durante verde y rojo. */
    private static final long MONITOR_INTERVAL_MS  = 500L;
    /** Intervalo de reintento cuando la simulación está en pausa. */
    private static final long PAUSE_POLL_MS        = 100L;

    private final TrafficLight             trafficLight;
    private final SimulationParams         params;
    private final EventBus                 eventBus;
    private final ScheduledExecutorService scheduler;
    /** Estado compartido de la simulación; puede ser null en tests unitarios. */
    private final SimulationState          simulationState;

    /** Número de extensiones aplicadas en el ciclo actual. Reinicia con cada ciclo completo. */
    private int extensionsInCurrentCycle = 0;
    /** Indica si el verde de este ciclo ya fue reducido (solo se permite una vez). */
    private volatile boolean greenReducedThisCycle = false;
    /** Indica si el rojo de este ciclo ya fue reducido (solo se permite una vez). */
    private volatile boolean redReducedThisCycle   = false;
    /** Timestamp absoluto en que comenzó la fase verde actual (para calcular elapsed). */
    private volatile long greenStartTimeMs         = 0L;
    /** Timestamp absoluto en que comenzó la fase roja actual. */
    private volatile long redStartTimeMs           = 0L;
    /** Future del fin de verde actual; se cancela y reagenda si se aplica reducción. */
    private volatile ScheduledFuture<?> greenEndFuture;
    /** Future del fin de rojo (transición a verde); se cancela y reagenda si se aplica reducción. */
    private volatile ScheduledFuture<?> redEndFuture;
    /** Future del monitor periódico durante la fase verde (cola==0). */
    private volatile ScheduledFuture<?> greenMonitorFuture;
    /** Future del monitor periódico durante la fase roja (cola>umbral crítico). */
    private volatile ScheduledFuture<?> redMonitorFuture;

    /**
     * Crea el hilo de semáforo con acceso al estado de simulación para respetar la pausa
     * y contabilizar extensiones/reducciones para las métricas.
     *
     * @param trafficLight    semáforo a controlar
     * @param params          parámetros de simulación con duraciones configuradas
     * @param eventBus        bus de eventos para publicar TRAFFIC_LIGHT_EXTENDED/REDUCED
     * @param scheduler       executor programado para los cambios de estado
     * @param simulationState estado compartido de la simulación (puede ser null en tests)
     */
    public TrafficLightThread(TrafficLight trafficLight, SimulationParams params,
                               EventBus eventBus, ScheduledExecutorService scheduler,
                               SimulationState simulationState) {
        this.trafficLight    = trafficLight;
        this.params          = params;
        this.eventBus        = eventBus;
        this.scheduler       = scheduler;
        this.simulationState = simulationState;
    }

    /**
     * Constructor sin estado de simulación para uso en tests unitarios.
     * El semáforo no respetará la pausa ni contabilizará en SimulationState; comportamiento
     * adecuado para pruebas aisladas del ciclo y la extensión inteligente.
     */
    public TrafficLightThread(TrafficLight trafficLight, SimulationParams params,
                               EventBus eventBus, ScheduledExecutorService scheduler) {
        this(trafficLight, params, eventBus, scheduler, null);
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
     * Detiene el semáforo cancelando todas las tareas programadas pendientes (incluidos
     * los monitores de verde y rojo).
     */
    public void stop() {
        cancelFuture(greenMonitorFuture);
        cancelFuture(redMonitorFuture);
        cancelFuture(greenEndFuture);
        cancelFuture(redEndFuture);
        scheduler.shutdownNow();
    }

    // ──────────────────────────────────────────────────────────────
    // Transiciones de estado (programadas en el scheduler)
    // ──────────────────────────────────────────────────────────────

    private void transitionToGreen() {
        if (scheduler.isShutdown()) return;
        if (isPaused()) {
            scheduler.schedule(this::transitionToGreen, PAUSE_POLL_MS, TimeUnit.MILLISECONDS);
            return;
        }

        cancelFuture(redMonitorFuture);

        trafficLight.setState(TrafficLightState.GREEN);
        trafficLight.setExtended(false);
        trafficLight.setReduced(false);
        extensionsInCurrentCycle = 0;
        greenReducedThisCycle    = false;
        greenStartTimeMs         = System.currentTimeMillis();
        trafficLight.setRemainingMs(params.getGreenDurationMs());

        log.trace("Semáforo {} → VERDE ({}ms)", trafficLight.getIntersectionId(), params.getGreenDurationMs());
        greenEndFuture = scheduler.schedule(this::onGreenEnd, params.getGreenDurationMs(), TimeUnit.MILLISECONDS);

        if (params.isSmartTrafficLights()) {
            // Monitor reactivo: detecta cola==0 antes de terminar el verde
            greenMonitorFuture = scheduler.scheduleAtFixedRate(
                    this::monitorGreenForReduction,
                    MONITOR_INTERVAL_MS, MONITOR_INTERVAL_MS, TimeUnit.MILLISECONDS);
        }
    }

    /**
     * Monitor periódico durante el verde: si la cola se vació después del tiempo mínimo,
     * reduce el restante a la mitad y reagenda el fin del verde. Solo se aplica una vez
     * por ciclo verde.
     */
    private void monitorGreenForReduction() {
        if (scheduler.isShutdown() || isPaused()) return;
        if (greenReducedThisCycle) return;
        if (trafficLight.getState() != TrafficLightState.GREEN) return;
        if (trafficLight.getQueueSize().get() != 0) return;

        long elapsed = System.currentTimeMillis() - greenStartTimeMs;
        if (elapsed < MIN_GREEN_ELAPSED_MS) return;

        long remaining = params.getGreenDurationMs() - elapsed;
        if (remaining <= MIN_REMAINING_MS) return;

        long newRemaining = Math.max(remaining / 2, MIN_REMAINING_MS);

        cancelFuture(greenEndFuture);
        greenEndFuture = scheduler.schedule(this::onGreenEnd, newRemaining, TimeUnit.MILLISECONDS);

        trafficLight.setRemainingMs(newRemaining);
        trafficLight.setReduced(true);
        greenReducedThisCycle = true;
        cancelFuture(greenMonitorFuture);

        if (simulationState != null) {
            simulationState.getTotalGreenReductions().incrementAndGet();
        }

        log.debug("Semáforo {} reduce verde (restante={}ms, cola=0)",
                trafficLight.getIntersectionId(), newRemaining);

        eventBus.publish(SimulationEvent.builder()
                .type(SimulationEventType.TRAFFIC_LIGHT_REDUCED)
                .timestamp(System.currentTimeMillis())
                .payload(Map.of(
                        "intersectionId",  trafficLight.getIntersectionId(),
                        "phase",           "GREEN",
                        "newRemainingMs",  newRemaining,
                        "queueSize",       trafficLight.getQueueSize().get()
                ))
                .build());
    }

    /**
     * Al finalizar el verde: verifica si aplica extensión inteligente o transita a amarillo.
     * No extiende si en este ciclo ya hubo una reducción (sería contradictorio).
     */
    private void onGreenEnd() {
        if (scheduler.isShutdown()) return;
        if (isPaused()) {
            scheduler.schedule(this::onGreenEnd, PAUSE_POLL_MS, TimeUnit.MILLISECONDS);
            return;
        }

        cancelFuture(greenMonitorFuture);

        boolean canExtend = params.isSmartTrafficLights()
                && !greenReducedThisCycle
                && trafficLight.isCongestedAbove(EXTENSION_THRESHOLD)
                && extensionsInCurrentCycle < MAX_EXTENSIONS;

        if (canExtend) {
            extensionsInCurrentCycle++;
            trafficLight.setExtended(true);
            trafficLight.setRemainingMs(EXTENSION_MS);

            if (simulationState != null) {
                simulationState.getTotalGreenExtensions().incrementAndGet();
            }

            log.debug("Semáforo {} extiende verde (extensión #{}/{}, cola={})",
                    trafficLight.getIntersectionId(), extensionsInCurrentCycle, MAX_EXTENSIONS,
                    trafficLight.getQueueSize().get());

            eventBus.publish(SimulationEvent.builder()
                    .type(SimulationEventType.TRAFFIC_LIGHT_EXTENDED)
                    .timestamp(System.currentTimeMillis())
                    .payload(Map.of(
                            "intersectionId",  trafficLight.getIntersectionId(),
                            "extensionNumber", extensionsInCurrentCycle,
                            "queueSize",       trafficLight.getQueueSize().get()
                    ))
                    .build());

            greenEndFuture = scheduler.schedule(this::onGreenEnd, EXTENSION_MS, TimeUnit.MILLISECONDS);
        } else {
            transitionToYellow();
        }
    }

    private void transitionToYellow() {
        if (scheduler.isShutdown()) return;
        if (isPaused()) {
            scheduler.schedule(this::transitionToYellow, PAUSE_POLL_MS, TimeUnit.MILLISECONDS);
            return;
        }

        trafficLight.setState(TrafficLightState.YELLOW);
        trafficLight.setExtended(false);
        trafficLight.setReduced(false);
        trafficLight.setRemainingMs(params.getYellowDurationMs());

        log.trace("Semáforo {} → AMARILLO ({}ms)", trafficLight.getIntersectionId(), params.getYellowDurationMs());
        scheduler.schedule(this::transitionToRed, params.getYellowDurationMs(), TimeUnit.MILLISECONDS);
    }

    private void transitionToRed() {
        if (scheduler.isShutdown()) return;
        if (isPaused()) {
            scheduler.schedule(this::transitionToRed, PAUSE_POLL_MS, TimeUnit.MILLISECONDS);
            return;
        }

        trafficLight.setState(TrafficLightState.RED);
        trafficLight.setExtended(false);
        trafficLight.setReduced(false);
        redReducedThisCycle = false;
        redStartTimeMs      = System.currentTimeMillis();
        trafficLight.setRemainingMs(params.getRedDurationMs());

        log.trace("Semáforo {} → ROJO ({}ms)", trafficLight.getIntersectionId(), params.getRedDurationMs());
        redEndFuture = scheduler.schedule(this::transitionToGreen, params.getRedDurationMs(), TimeUnit.MILLISECONDS);

        if (params.isSmartTrafficLights()) {
            // Monitor reactivo: detecta cola crítica durante el rojo
            redMonitorFuture = scheduler.scheduleAtFixedRate(
                    this::monitorRedForReduction,
                    MONITOR_INTERVAL_MS, MONITOR_INTERVAL_MS, TimeUnit.MILLISECONDS);
        }
    }

    /**
     * Monitor periódico durante el rojo: si la cola supera el umbral crítico, reduce 1s
     * del tiempo restante y reagenda la transición a verde. Solo se aplica una vez por
     * ciclo rojo.
     */
    private void monitorRedForReduction() {
        if (scheduler.isShutdown() || isPaused()) return;
        if (redReducedThisCycle) return;
        if (trafficLight.getState() != TrafficLightState.RED) return;
        if (trafficLight.getQueueSize().get() <= RED_REDUCE_THRESHOLD) return;

        long elapsed   = System.currentTimeMillis() - redStartTimeMs;
        long remaining = params.getRedDurationMs() - elapsed;
        if (remaining <= MIN_RED_REMAINING_MS) return;

        long newRemaining = Math.max(remaining - RED_REDUCE_MS, MIN_RED_REMAINING_MS);

        cancelFuture(redEndFuture);
        redEndFuture = scheduler.schedule(this::transitionToGreen, newRemaining, TimeUnit.MILLISECONDS);

        trafficLight.setRemainingMs(newRemaining);
        trafficLight.setReduced(true);
        redReducedThisCycle = true;
        cancelFuture(redMonitorFuture);

        if (simulationState != null) {
            simulationState.getTotalRedReductions().incrementAndGet();
        }

        int queueSize = trafficLight.getQueueSize().get();
        log.debug("Semáforo {} reduce rojo (restante={}ms, cola crítica={})",
                trafficLight.getIntersectionId(), newRemaining, queueSize);

        eventBus.publish(SimulationEvent.builder()
                .type(SimulationEventType.TRAFFIC_LIGHT_REDUCED)
                .timestamp(System.currentTimeMillis())
                .payload(Map.of(
                        "intersectionId",  trafficLight.getIntersectionId(),
                        "phase",           "RED",
                        "newRemainingMs",  newRemaining,
                        "queueSize",       queueSize
                ))
                .build());
    }

    /** Devuelve true si la simulación está actualmente pausada. Null-safe para tests. */
    private boolean isPaused() {
        return simulationState != null && simulationState.isPaused();
    }

    /** Cancela un ScheduledFuture si no es null y aún no se completó. */
    private void cancelFuture(ScheduledFuture<?> future) {
        if (future != null && !future.isDone()) {
            future.cancel(false);
        }
    }
}
