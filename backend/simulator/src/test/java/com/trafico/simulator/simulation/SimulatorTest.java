package com.trafico.simulator.simulation;

import com.trafico.simulator.domain.enums.TrafficLightState;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.simulation.routing.AStarRouteCalculator;
import com.trafico.simulator.simulation.routing.ParallelRouteCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de integración para Simulator: orquestación dual (SEQ + PAR) end-to-end.
 * Verifica el ciclo start/pause/resume/stop y que ambos runners arrancan correctamente.
 */
class SimulatorTest {

    private Simulator              simulator;
    private EventBus               eventBus;
    private List<SimulationEvent>  events;

    @BeforeEach
    void setUp() {
        eventBus = new EventBus();
        AStarRouteCalculator    astar    = new AStarRouteCalculator();
        ParallelRouteCalculator parallel = new ParallelRouteCalculator(astar);

        simulator = new Simulator(eventBus, astar, parallel);

        events = new ArrayList<>();
        eventBus.subscribe(events::add);
    }

    @AfterEach
    void tearDown() {
        simulator.stop();
    }

    @Test
    @DisplayName("start crea dos runners (SEQ + PAR) y ambos quedan en estado running")
    void startCreatesBothRunners() {
        String simId = simulator.start(quickParams(8, 5));

        assertNotNull(simId);
        assertTrue(simId.startsWith("SIM-"));
        assertNotNull(simulator.getSeqRunner());
        assertNotNull(simulator.getParRunner());
        assertTrue(simulator.getSeqRunner().getState().isRunning());
        assertTrue(simulator.getParRunner().getState().isRunning());
    }

    @Test
    @DisplayName("ambos runners reciben los mismos vehículos (mismo count)")
    void bothRunnersHaveSameVehicleCount() {
        simulator.start(quickParams(8, 10));

        int seqCount = simulator.getSeqRunner().getState().getVehicles().size();
        int parCount = simulator.getParRunner().getState().getVehicles().size();
        assertEquals(seqCount, parCount, "Ambos runners deben tener el mismo número de vehículos");
        assertEquals(10, seqCount);
    }

    @Test
    @DisplayName("ambos runners tienen los mismos tiempos de benchmark (seq/par)")
    void bothRunnersShareBenchmarkTimes() {
        simulator.start(quickParams(8, 10));

        SimulationState seqState = simulator.getSeqRunner().getState();
        SimulationState parState = simulator.getParRunner().getState();

        assertEquals(seqState.getSequentialRouteTimeMs(), parState.getSequentialRouteTimeMs());
        assertEquals(seqState.getParallelRouteTimeMs(),   parState.getParallelRouteTimeMs());
        assertTrue(seqState.getSequentialRouteTimeMs() >= 0);
        assertTrue(seqState.getParallelRouteTimeMs() >= 0);
    }

    @Test
    @DisplayName("pause marca ambos runners como pausados")
    void pauseAffectsBothRunners() {
        simulator.start(quickParams(8, 5));
        simulator.pause();

        assertTrue(simulator.getSeqRunner().getState().isPaused());
        assertTrue(simulator.getParRunner().getState().isPaused());
        assertTrue(simulator.isRunning());
        assertTrue(simulator.isPaused());
    }

    @Test
    @DisplayName("resume reanuda ambos runners")
    void resumeAffectsBothRunners() {
        simulator.start(quickParams(8, 5));
        simulator.pause();
        simulator.resume();

        assertFalse(simulator.getSeqRunner().getState().isPaused());
        assertFalse(simulator.getParRunner().getState().isPaused());
    }

    @Test
    @DisplayName("stop desactiva ambos runners")
    void stopDeactivatesBothRunners() {
        simulator.start(quickParams(8, 5));
        simulator.stop();

        assertFalse(simulator.isRunning());
        assertFalse(simulator.getSeqRunner().getState().isRunning());
        assertFalse(simulator.getParRunner().getState().isRunning());
    }

    @Test
    @DisplayName("setSpeed no lanza excepción con runners activos")
    void setSpeedDoesNotThrow() {
        simulator.start(quickParams(8, 3));
        assertDoesNotThrow(() -> simulator.setSpeed(2.5));
    }

    @Test
    @DisplayName("los semáforos del runner PAR eventualmente alcanzan GREEN")
    void trafficLightsStartCycling() {
        SimulationParams params = SimulationParams.builder()
                .gridSize(8).vehicleCount(5)
                .executionMode(com.trafico.simulator.domain.enums.ExecutionMode.PARALLEL)
                .greenDurationMs(200).yellowDurationMs(100).redDurationMs(200)
                .simulationSpeed(1.0).smartTrafficLights(false).build();
        simulator.start(params);

        await().atMost(2, TimeUnit.SECONDS).until(() ->
                simulator.getParRunner().getState().getCity().getAllTrafficLights().stream()
                        .anyMatch(tl -> tl.getState() == TrafficLightState.GREEN));
    }

    @Test
    @DisplayName("simulación pequeña publica SIMULATION_FINISHED desde cada runner")
    void smallSimulationPublishesFinished() {
        SimulationParams params = SimulationParams.builder()
                .gridSize(6).vehicleCount(3)
                .executionMode(com.trafico.simulator.domain.enums.ExecutionMode.PARALLEL)
                .greenDurationMs(100).yellowDurationMs(50).redDurationMs(100)
                .simulationSpeed(10.0).smartTrafficLights(false).build();
        simulator.start(params);

        // Esperamos 2 eventos SIMULATION_FINISHED (uno por cada runner)
        await().atMost(60, TimeUnit.SECONDS).until(() ->
                events.stream()
                      .filter(e -> e.getType() == SimulationEventType.SIMULATION_FINISHED)
                      .count() >= 2);
    }

    private SimulationParams quickParams(int gridSize, int vehicleCount) {
        return SimulationParams.builder()
                .gridSize(gridSize).vehicleCount(vehicleCount)
                .executionMode(com.trafico.simulator.domain.enums.ExecutionMode.PARALLEL)
                .greenDurationMs(2000).yellowDurationMs(800).redDurationMs(2000)
                .simulationSpeed(1.0).smartTrafficLights(false).build();
    }
}
