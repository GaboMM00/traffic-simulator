package com.trafico.simulator.websocket;

import com.trafico.simulator.domain.enums.Direction;
import com.trafico.simulator.domain.enums.TrafficLightState;
import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.event.SimulationEventType;
import com.trafico.simulator.metrics.MetricsCollector;
import com.trafico.simulator.simulation.SimulationRunner;
import com.trafico.simulator.simulation.SimulationState;
import com.trafico.simulator.simulation.Simulator;
import com.trafico.simulator.websocket.dto.SimulationEventDTO;
import com.trafico.simulator.websocket.dto.WorldStateDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests para SimulationBroadcaster en modo dual (SEQ + PAR).
 * Verifica construcción de DTOs, condiciones de envío y reenvío de eventos.
 */
class SimulationBroadcasterTest {

    private SimpMessagingTemplate template;
    private SimulationState       seqState;
    private SimulationState       parState;
    private MetricsCollector      collector;
    private EventBus              bus;
    private Simulator             simulator;
    private SimulationBroadcaster broadcaster;

    @BeforeEach
    void setUp() {
        template  = mock(SimpMessagingTemplate.class);
        seqState  = new SimulationState();
        parState  = new SimulationState();
        bus       = new EventBus();

        SimulationRunner seqRunner = mock(SimulationRunner.class);
        SimulationRunner parRunner = mock(SimulationRunner.class);
        when(seqRunner.getState()).thenReturn(seqState);
        when(parRunner.getState()).thenReturn(parState);

        simulator = mock(Simulator.class);
        when(simulator.getSeqRunner()).thenReturn(seqRunner);
        when(simulator.getParRunner()).thenReturn(parRunner);

        // MetricsCollector sigue necesitando un SimulationState para su constructor (Spring)
        // En el test usamos parState como proxy
        collector   = new MetricsCollector(parState);
        broadcaster = new SimulationBroadcaster(template, simulator, collector, bus);
    }

    @Test
    @DisplayName("init() suscribe el broadcaster al EventBus")
    void initSubscribesToEventBus() {
        broadcaster.init();
        bus.publish(SimulationEvent.of(SimulationEventType.VEHICLE_ARRIVED, 100));
        verify(template, atLeastOnce()).convertAndSend(
                eq(SimulationBroadcaster.TOPIC_EVENTS), any(SimulationEventDTO.class));
    }

    @Test
    @DisplayName("broadcastWorldState NO envía nada si ambos runners están detenidos")
    void worldStateSkippedWhenNotRunning() {
        seqState.setRunning(false);
        parState.setRunning(false);
        broadcaster.broadcastWorldState();
        verifyNoInteractions(template);
    }

    @Test
    @DisplayName("broadcastWorldState NO envía nada si ambos runners están pausados")
    void worldStateSkippedWhenPaused() {
        seqState.setRunning(true);
        seqState.setPaused(true);
        parState.setRunning(true);
        parState.setPaused(true);
        broadcaster.broadcastWorldState();
        verifyNoInteractions(template);
    }

    @Test
    @DisplayName("broadcastWorldState envía al canal SEQ cuando seqRunner está corriendo")
    void worldStateSentToSeqTopicWhenRunning() {
        seqState.setRunning(true);
        seqState.setCity(City.build(4));
        parState.setRunning(false);

        broadcaster.broadcastWorldState();

        ArgumentCaptor<WorldStateDTO> captor = ArgumentCaptor.forClass(WorldStateDTO.class);
        verify(template).convertAndSend(eq(SimulationBroadcaster.TOPIC_WORLD_STATE_SEQ), captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("broadcastWorldState envía al canal PAR cuando parRunner está corriendo")
    void worldStateSentToParTopicWhenRunning() {
        seqState.setRunning(false);
        parState.setRunning(true);
        parState.setCity(City.build(4));

        broadcaster.broadcastWorldState();

        ArgumentCaptor<WorldStateDTO> captor = ArgumentCaptor.forClass(WorldStateDTO.class);
        verify(template).convertAndSend(eq(SimulationBroadcaster.TOPIC_WORLD_STATE_PAR), captor.capture());
        assertNotNull(captor.getValue());
    }

    @Test
    @DisplayName("buildWorldState excluye vehículos COMPLETED del listado")
    void worldStateExcludesCompletedVehicles() {
        parState.setCity(City.build(4));
        Vehicle moving = vehicle("V-001", VehicleState.MOVING,    new Coordinate(0, 0));
        Vehicle done   = vehicle("V-002", VehicleState.COMPLETED, new Coordinate(1, 0));
        parState.getVehicles().put(moving.getId(), moving);
        parState.getVehicles().put(done.getId(),   done);

        WorldStateDTO dto = broadcaster.buildWorldState(parState);
        assertEquals(1, dto.getVehicles().size());
        assertEquals("V-001", dto.getVehicles().get(0).getId());
    }

    @Test
    @DisplayName("buildWorldState mapea semáforos al DTO con su intersección")
    void worldStateMapsTrafficLights() {
        City city = City.build(4);
        parState.setCity(city);
        city.getIntersection(new Coordinate(0, 0)).getTrafficLight().setState(TrafficLightState.GREEN);
        city.getIntersection(new Coordinate(0, 0)).getTrafficLight().setRemainingMs(2500L);

        WorldStateDTO dto = broadcaster.buildWorldState(parState);
        assertFalse(dto.getTrafficLights().isEmpty());
        assertTrue(dto.getTrafficLights().stream()
                .anyMatch(t -> "I-0-0".equals(t.getIntersectionId())
                        && "GREEN".equals(t.getState())
                        && t.getRemainingMs() == 2500L));
    }

    @Test
    @DisplayName("onSimulationEvent reenvía el evento al canal /topic/events con payload intacto")
    void eventForwardedWithPayload() {
        SimulationEvent event = SimulationEvent.builder()
                .type(SimulationEventType.VEHICLE_ARRIVED)
                .timestamp(12345L)
                .payload(Map.of("vehicleId", "V-007", "arrivalOrder", 1))
                .build();

        broadcaster.onSimulationEvent(event);

        ArgumentCaptor<SimulationEventDTO> captor = ArgumentCaptor.forClass(SimulationEventDTO.class);
        verify(template).convertAndSend(eq(SimulationBroadcaster.TOPIC_EVENTS), captor.capture());
        SimulationEventDTO sent = captor.getValue();
        assertEquals("VEHICLE_ARRIVED", sent.getType());
        assertEquals(12345L,            sent.getTimestamp());
        assertEquals("V-007",           sent.getPayload().get("vehicleId"));
    }

    // ──────────────────────────────────────────────────────────────

    private Vehicle vehicle(String id, VehicleState vs, Coordinate at) {
        Vehicle v = new Vehicle(id, 0, 0L);
        v.setCurrentPosition(at);
        v.setPreviousPosition(at);
        v.setDirection(Direction.EAST);
        v.setState(vs);
        return v;
    }
}
