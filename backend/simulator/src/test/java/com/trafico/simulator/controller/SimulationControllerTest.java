package com.trafico.simulator.controller;

import com.trafico.simulator.controller.dto.StartSimulationRequest;
import com.trafico.simulator.controller.dto.StartSimulationResponse;
import com.trafico.simulator.controller.dto.StatusResponse;
import com.trafico.simulator.controller.dto.StopSimulationResponse;
import com.trafico.simulator.domain.enums.ExecutionMode;
import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.metrics.MetricsCollector;
import com.trafico.simulator.simulation.SimulationRunner;
import com.trafico.simulator.simulation.SimulationState;
import com.trafico.simulator.simulation.Simulator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests para SimulationController con simulación dual (SEQ + PAR).
 * No levanta contexto Spring completo.
 */
class SimulationControllerTest {

    private Simulator             simulator;
    private SimulationState       seqState;
    private SimulationState       parState;
    private MetricsCollector      collector;
    private SimulationController  controller;

    @BeforeEach
    void setUp() {
        simulator = mock(Simulator.class);
        seqState  = new SimulationState();
        parState  = new SimulationState();

        SimulationRunner seqRunner = mock(SimulationRunner.class);
        SimulationRunner parRunner = mock(SimulationRunner.class);
        when(seqRunner.getState()).thenReturn(seqState);
        when(parRunner.getState()).thenReturn(parState);
        when(simulator.getSeqRunner()).thenReturn(seqRunner);
        when(simulator.getParRunner()).thenReturn(parRunner);

        // MetricsCollector necesita un SimulationState para su constructor; usamos parState
        collector  = new MetricsCollector(parState);
        controller = new SimulationController(simulator, collector);
    }

    @Test
    @DisplayName("start mapea el request a SimulationParams y delega al Simulator")
    void startMapsAndDelegates() {
        when(simulator.start(any(SimulationParams.class))).thenAnswer(inv -> {
            SimulationParams p = inv.getArgument(0);
            parState.setParams(p);
            parState.setCity(City.build(p.getGridSize()));
            return "SIM-TEST-001";
        });

        StartSimulationRequest req = StartSimulationRequest.builder()
                .gridSize(8)
                .vehicleCount(20)
                .simulationSpeed(1.5)
                .smartTrafficLights(true)
                .trafficLight(new StartSimulationRequest.TrafficLightConfig(4000L, 1500L, 5000L))
                .build();

        ResponseEntity<StartSimulationResponse> resp = controller.start(req);
        StartSimulationResponse body = resp.getBody();

        assertNotNull(body);
        assertEquals("SIM-TEST-001", body.getSimulationId());
        assertEquals("LOADING",      body.getStatus());
        assertEquals(8,              body.getGridSize());
        assertEquals(20,             body.getVehicleCount());
        assertTrue(body.getTrafficLightCount() > 0);
    }

    @Test
    @DisplayName("start aplica defaults para campos null del request")
    void startAppliesDefaults() {
        when(simulator.start(any(SimulationParams.class))).thenReturn("SIM-X");

        controller.start(new StartSimulationRequest());

        verify(simulator).start(argThat(p ->
                p.getGridSize() == 12
             && p.getVehicleCount() == 50
             && p.getGreenDurationMs() == 5000L
             && p.getExecutionMode() == ExecutionMode.PARALLEL
        ));
    }

    @Test
    @DisplayName("pause y resume delegan al simulator")
    void pauseAndResumeDelegate() {
        controller.pause();
        controller.resume();
        verify(simulator).pause();
        verify(simulator).resume();
    }

    @Test
    @DisplayName("stop devuelve respuesta con resultados SEQ y PAR")
    void stopReturnsFullDualResponse() {
        when(simulator.getSimulationId()).thenReturn("SIM-FINAL");

        seqState.setSimulationId("SIM-FINAL-SEQUENTIAL");
        seqState.setParams(SimulationParams.defaults());
        seqState.setSequentialRouteTimeMs(400L);
        seqState.setParallelRouteTimeMs(100L);
        seqState.getSimulationTimeMs().set(40_000L);

        parState.setSimulationId("SIM-FINAL-PARALLEL");
        parState.setParams(SimulationParams.defaults());
        parState.setSequentialRouteTimeMs(400L);
        parState.setParallelRouteTimeMs(100L);
        parState.getSimulationTimeMs().set(45_200L);

        Vehicle v1 = vehicle("V-001", seqState, 12_400L, 1);
        Vehicle v2 = vehicle("V-001", parState,  8_000L, 1);

        ResponseEntity<StopSimulationResponse> resp = controller.stop();
        StopSimulationResponse body = resp.getBody();

        assertNotNull(body);
        assertEquals("SIM-FINAL",    body.getSimulationId());
        assertEquals(45_200L,        body.getTotalDurationMs());
        assertNotNull(body.getCompletedAt());

        assertNotNull(body.getRouteCalculation());
        assertEquals(400L, body.getRouteCalculation().getSequentialTimeMs());
        assertEquals(100L, body.getRouteCalculation().getParallelTimeMs());
        assertEquals(4.0,  body.getRouteCalculation().getSpeedup(), 0.001);

        assertNotNull(body.getSequential());
        assertNotNull(body.getParallel());
        assertEquals("V-001", body.getSequential().getSummary().getFirstVehicleId());
        assertEquals("V-001", body.getParallel().getSummary().getFirstVehicleId());
        assertEquals(40_000L, body.getSequential().getDurationMs());
        assertEquals(45_200L, body.getParallel().getDurationMs());

        verify(simulator).stop();
    }

    @Test
    @DisplayName("status retorna IDLE cuando no hay simulación")
    void statusIdle() {
        when(simulator.isRunning()).thenReturn(false);
        when(simulator.isPaused()).thenReturn(false);
        when(simulator.getSimulationId()).thenReturn(null);
        when(simulator.getParRunner()).thenReturn(null);

        ResponseEntity<StatusResponse> resp = controller.status();
        assertEquals("IDLE", resp.getBody().getStatus());
        assertNull(resp.getBody().getSimulationId());
    }

    @Test
    @DisplayName("status retorna RUNNING cuando está corriendo")
    void statusRunning() {
        when(simulator.isRunning()).thenReturn(true);
        when(simulator.isPaused()).thenReturn(false);
        when(simulator.getSimulationId()).thenReturn("SIM-R");

        parState.setSimulationId("SIM-R-PARALLEL");
        parState.setParams(SimulationParams.defaults());

        ResponseEntity<StatusResponse> resp = controller.status();
        assertEquals("RUNNING", resp.getBody().getStatus());
        assertEquals("SIM-R",   resp.getBody().getSimulationId());
        assertEquals(12,        resp.getBody().getGridSize());
    }

    @Test
    @DisplayName("status retorna PAUSED cuando running=true y paused=true")
    void statusPaused() {
        when(simulator.isRunning()).thenReturn(true);
        when(simulator.isPaused()).thenReturn(true);
        when(simulator.getSimulationId()).thenReturn("SIM-P");

        ResponseEntity<StatusResponse> resp = controller.status();
        assertEquals("PAUSED", resp.getBody().getStatus());
    }

    @Test
    @DisplayName("status retorna STOPPED cuando hay simulationId pero ya no corre")
    void statusStopped() {
        when(simulator.isRunning()).thenReturn(false);
        when(simulator.isPaused()).thenReturn(false);
        when(simulator.getSimulationId()).thenReturn("SIM-S");

        ResponseEntity<StatusResponse> resp = controller.status();
        assertEquals("STOPPED", resp.getBody().getStatus());
    }

    // ──────────────────────────────────────────────────────────────

    private Vehicle vehicle(String id, SimulationState targetState, long travelMs, int arrivalOrder) {
        Vehicle v = new Vehicle(id, 0, 0L);
        v.setState(VehicleState.COMPLETED);
        v.setTravelTimeMs(travelMs);
        v.setArrivalOrder(arrivalOrder);
        targetState.getVehicles().put(id, v);
        return v;
    }
}
