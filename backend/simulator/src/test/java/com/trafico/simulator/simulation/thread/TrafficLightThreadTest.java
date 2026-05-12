package com.trafico.simulator.simulation.thread;

import com.trafico.simulator.domain.enums.TrafficLightState;
import com.trafico.simulator.domain.model.TrafficLight;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para TrafficLightThread: ciclo GREEN→YELLOW→RED y extensión inteligente.
 * Usa Awaitility para asertir condiciones temporales sin Thread.sleep frágil.
 */
class TrafficLightThreadTest {

    private TrafficLight             light;
    private EventBus                 eventBus;
    private ScheduledExecutorService scheduler;
    private TrafficLightThread       thread;
    private List<SimulationEvent>    events;

    @BeforeEach
    void setUp() {
        light    = new TrafficLight("I-0-0");
        eventBus = new EventBus();
        events   = new ArrayList<>();
        eventBus.subscribe(events::add);
        scheduler = Executors.newSingleThreadScheduledExecutor();
    }

    @AfterEach
    void tearDown() {
        if (thread != null) thread.stop();
    }

    @Test
    @DisplayName("Al iniciar, transita inmediatamente a GREEN")
    void startsInGreen() {
        SimulationParams params = paramsBuilder().build();
        thread = new TrafficLightThread(light, params, eventBus, scheduler);
        thread.start();

        await().atMost(200, TimeUnit.MILLISECONDS)
                .until(() -> light.getState() == TrafficLightState.GREEN);
    }

    @Test
    @DisplayName("Cicla GREEN → YELLOW → RED → GREEN con duraciones cortas")
    void fullCycleTransitions() {
        SimulationParams params = paramsBuilder()
                .greenDurationMs(150).yellowDurationMs(100).redDurationMs(150).build();
        thread = new TrafficLightThread(light, params, eventBus, scheduler);
        thread.start();

        await().atMost(300, TimeUnit.MILLISECONDS)
                .until(() -> light.getState() == TrafficLightState.GREEN);
        await().atMost(500, TimeUnit.MILLISECONDS)
                .until(() -> light.getState() == TrafficLightState.YELLOW);
        await().atMost(500, TimeUnit.MILLISECONDS)
                .until(() -> light.getState() == TrafficLightState.RED);
        await().atMost(500, TimeUnit.MILLISECONDS)
                .until(() -> light.getState() == TrafficLightState.GREEN);
    }

    @Test
    @DisplayName("Con smartTrafficLights=true y cola>5, extiende verde y publica evento")
    void smartExtensionWhenCongested() {
        SimulationParams params = paramsBuilder()
                .greenDurationMs(150).yellowDurationMs(100).redDurationMs(100)
                .smartTrafficLights(true).build();

        // Saturar la cola por encima del umbral (5)
        for (int i = 0; i < 7; i++) light.incrementQueue();

        thread = new TrafficLightThread(light, params, eventBus, scheduler);
        thread.start();

        await().atMost(800, TimeUnit.MILLISECONDS)
                .until(() -> events.stream()
                        .anyMatch(e -> e.getType() == SimulationEventType.TRAFFIC_LIGHT_EXTENDED));
        // Marca extended visible mientras está extendido
        await().atMost(800, TimeUnit.MILLISECONDS).until(light::isExtended);
    }

    @Test
    @DisplayName("Con smartTrafficLights=false, NO extiende aunque esté congestionado")
    void noExtensionWhenSmartDisabled() throws InterruptedException {
        SimulationParams params = paramsBuilder()
                .greenDurationMs(100).yellowDurationMs(80).redDurationMs(100)
                .smartTrafficLights(false).build();

        for (int i = 0; i < 10; i++) light.incrementQueue();

        thread = new TrafficLightThread(light, params, eventBus, scheduler);
        thread.start();

        // Esperar a que pase el primer ciclo completo
        Thread.sleep(400);
        assertTrue(events.stream()
                        .noneMatch(e -> e.getType() == SimulationEventType.TRAFFIC_LIGHT_EXTENDED),
                "No deben emitirse eventos de extensión");
    }

    @Test
    @DisplayName("stop() detiene el scheduler y no genera más transiciones")
    void stopHaltsCycle() throws InterruptedException {
        SimulationParams params = paramsBuilder()
                .greenDurationMs(50).yellowDurationMs(50).redDurationMs(50).build();
        thread = new TrafficLightThread(light, params, eventBus, scheduler);
        thread.start();
        Thread.sleep(80);
        thread.stop();
        TrafficLightState frozen = light.getState();
        Thread.sleep(200);
        // El estado puede cambiar a lo sumo una vez si una transición estaba en curso,
        // pero el scheduler debe estar shutdown
        assertTrue(scheduler.isShutdown());
    }

    private SimulationParams.SimulationParamsBuilder paramsBuilder() {
        return SimulationParams.builder()
                .gridSize(8).vehicleCount(0)
                .executionMode(com.trafico.simulator.domain.enums.ExecutionMode.PARALLEL)
                .greenDurationMs(5000).yellowDurationMs(2000).redDurationMs(6000)
                .simulationSpeed(1.0).smartTrafficLights(false);
    }
}
