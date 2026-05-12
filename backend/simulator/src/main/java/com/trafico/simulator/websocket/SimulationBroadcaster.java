package com.trafico.simulator.websocket;

import com.trafico.simulator.domain.enums.VehicleState;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Intersection;
import com.trafico.simulator.domain.model.TrafficLight;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.event.SimulationEvent;
import com.trafico.simulator.metrics.MetricsCollector;
import com.trafico.simulator.simulation.SimulationRunner;
import com.trafico.simulator.simulation.SimulationState;
import com.trafico.simulator.simulation.Simulator;
import com.trafico.simulator.websocket.dto.MetricsDTO;
import com.trafico.simulator.websocket.dto.SimulationEventDTO;
import com.trafico.simulator.websocket.dto.TrafficLightDTO;
import com.trafico.simulator.websocket.dto.VehicleDTO;
import com.trafico.simulator.websocket.dto.WorldStateDTO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

/**
 * Transmite el estado de la simulación al frontend vía WebSocket STOMP.
 *
 * Con la simulación dual, cada runner tiene su propio canal de world-state:
 *   - /topic/world-state/seq  cada 100ms (estado del runner SEQUENTIAL)
 *   - /topic/world-state/par  cada 100ms (estado del runner PARALLEL)
 *   - /topic/events           inmediato (eventos de ambos runners, con "mode" en payload)
 *
 * Los eventos se reciben del {@link EventBus} compartido (spring singleton).
 * Cada {@link SimulationRunner} inyecta {@code "mode"} en el payload antes de
 * reenviar el evento al bus compartido, por lo que el broadcaster no necesita
 * saber de qué runner proviene.
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class SimulationBroadcaster {

    public static final String TOPIC_WORLD_STATE_SEQ = "/topic/world-state/seq";
    public static final String TOPIC_WORLD_STATE_PAR = "/topic/world-state/par";
    /** Mantenido para backward compat con tests que verifican topic genérico. */
    public static final String TOPIC_WORLD_STATE     = "/topic/world-state/par";
    public static final String TOPIC_EVENTS          = "/topic/events";
    /** Ya no se usa activamente (métricas embebidas en world-state), pero mantenido para tests. */
    public static final String TOPIC_METRICS         = "/topic/metrics";

    private final SimpMessagingTemplate messagingTemplate;
    private final Simulator             simulator;
    private final MetricsCollector      metricsCollector;
    private final EventBus              eventBus;

    @PostConstruct
    public void init() {
        eventBus.subscribe(this::onSimulationEvent);
        log.info("SimulationBroadcaster suscrito al EventBus compartido");
    }

    /** Transmite el world-state de ambos runners a sus respectivos canales. */
    @Scheduled(fixedRateString = "${websocket.broadcast-interval-ms:100}")
    public void broadcastWorldState() {
        broadcastRunner(simulator.getSeqRunner(), TOPIC_WORLD_STATE_SEQ);
        broadcastRunner(simulator.getParRunner(), TOPIC_WORLD_STATE_PAR);
    }

    private void broadcastRunner(SimulationRunner runner, String topic) {
        if (runner == null) return;
        SimulationState state = runner.getState();
        if (!state.isRunning() || state.isPaused()) return;
        messagingTemplate.convertAndSend(topic, buildWorldState(state));
    }

    /** Reenvía un evento del EventBus al canal /topic/events. */
    public void onSimulationEvent(SimulationEvent event) {
        SimulationEventDTO dto = SimulationEventDTO.builder()
                .type(event.getType().name())
                .timestamp(event.getTimestamp())
                .payload(event.getPayload())
                .build();
        messagingTemplate.convertAndSend(TOPIC_EVENTS, dto);
        log.debug("Evento reenviado por WebSocket: {} [mode={}]",
                event.getType(), event.getPayload().get("mode"));
    }

    // ──────────────────────────────────────────────────────────────
    // Construcción del DTO del mundo
    // ──────────────────────────────────────────────────────────────

    /**
     * Construye el DTO del estado del mundo a partir de un SimulationState específico.
     * Excluye vehículos COMPLETED para reducir el payload del WebSocket.
     */
    WorldStateDTO buildWorldState(SimulationState state) {
        List<VehicleDTO> vehicleDtos = state.getVehicles().values().stream()
                .filter(v -> v.getState() != VehicleState.COMPLETED)
                .map(this::toVehicleDTO)
                .toList();

        List<TrafficLightDTO> lightDtos = buildTrafficLightDtos(state.getCity());
        MetricsDTO metricsDto = buildSnapshotMetricsDTO(state);

        return WorldStateDTO.builder()
                .tick(state.getTick().get())
                .simulationTimeMs(state.getSimulationTimeMs().get())
                .vehicles(vehicleDtos)
                .trafficLights(lightDtos)
                .metrics(metricsDto)
                .build();
    }

    private VehicleDTO toVehicleDTO(Vehicle v) {
        return VehicleDTO.builder()
                .id(v.getId())
                .col(v.getCurrentPosition().getCol())
                .row(v.getCurrentPosition().getRow())
                .prevCol(v.getPreviousPosition() != null
                        ? v.getPreviousPosition().getCol() : v.getCurrentPosition().getCol())
                .prevRow(v.getPreviousPosition() != null
                        ? v.getPreviousPosition().getRow() : v.getCurrentPosition().getRow())
                .direction(v.getDirection() != null ? v.getDirection().name() : null)
                .state(v.getState().name())
                .colorIndex(v.getColorIndex())
                .isLeader(v.isLeader())
                .travelTimeMs(v.getTravelTimeMs())
                .waitTimeMs(v.getWaitTimeMs().get())
                .build();
    }

    private List<TrafficLightDTO> buildTrafficLightDtos(City city) {
        if (city == null) return List.of();
        return city.getIntersections().values().stream()
                .filter(Intersection::hasTrafficLight)
                .map(this::toTrafficLightDTO)
                .toList();
    }

    private TrafficLightDTO toTrafficLightDTO(Intersection intersection) {
        TrafficLight light = intersection.getTrafficLight();
        return TrafficLightDTO.builder()
                .intersectionId(intersection.getId())
                .col(intersection.getCoordinate().getCol())
                .row(intersection.getCoordinate().getRow())
                .state(light.getState().name())
                .remainingMs(light.getRemainingMs())
                .queueSize(light.getQueueSize().get())
                .isExtended(light.isExtended())
                .build();
    }

    private MetricsDTO buildSnapshotMetricsDTO(SimulationState state) {
        Collection<Vehicle> vehicles = state.getVehicles().values();
        int active    = (int) vehicles.stream().filter(v -> v.getState() == VehicleState.MOVING
                                                         || v.getState() == VehicleState.CALCULATING).count();
        int completed = (int) vehicles.stream().filter(Vehicle::isCompleted).count();
        int waiting   = (int) vehicles.stream().filter(v -> v.getState() == VehicleState.WAITING).count();

        String congested = null;
        City city = state.getCity();
        if (city != null) {
            Intersection top = city.getMostCongestedIntersection();
            if (top != null) congested = top.getId();
        }

        return MetricsDTO.builder()
                .activeVehicles(active)
                .completedVehicles(completed)
                .waitingVehicles(waiting)
                .mostCongestedIntersectionId(congested)
                .build();
    }
}
