package com.trafico.simulator.event;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para EventBus: distribución a múltiples suscriptores, robustez ante errores
 * y comportamiento thread-safe bajo publicaciones concurrentes.
 */
class EventBusTest {

    private EventBus bus;

    @BeforeEach
    void setUp() {
        bus = new EventBus();
    }

    @Test
    @DisplayName("Cada suscriptor recibe cada evento publicado")
    void allSubscribersReceiveEvents() {
        List<SimulationEvent> a = new ArrayList<>();
        List<SimulationEvent> b = new ArrayList<>();
        bus.subscribe(a::add);
        bus.subscribe(b::add);

        bus.publish(SimulationEvent.of(SimulationEventType.VEHICLE_ARRIVED, 100));
        bus.publish(SimulationEvent.of(SimulationEventType.HIGH_CONGESTION, 200));

        assertEquals(2, a.size());
        assertEquals(2, b.size());
    }

    @Test
    @DisplayName("Un suscriptor que lanza excepción no impide entregar al resto")
    void subscriberExceptionDoesNotPropagate() {
        AtomicInteger received = new AtomicInteger(0);
        bus.subscribe(e -> { throw new RuntimeException("boom"); });
        bus.subscribe(e -> received.incrementAndGet());

        assertDoesNotThrow(() -> bus.publish(SimulationEvent.of(
                SimulationEventType.SIMULATION_FINISHED, 0)));
        assertEquals(1, received.get());
    }

    @Test
    @DisplayName("clearSubscribers elimina todos los suscriptores")
    void clearSubscribers() {
        AtomicInteger received = new AtomicInteger(0);
        bus.subscribe(e -> received.incrementAndGet());
        bus.clearSubscribers();
        bus.publish(SimulationEvent.of(SimulationEventType.VEHICLE_ARRIVED, 0));
        assertEquals(0, received.get());
    }

    @Test
    @DisplayName("Publicaciones desde N hilos concurrentes son thread-safe")
    void concurrentPublishingIsThreadSafe() throws InterruptedException {
        AtomicInteger count = new AtomicInteger(0);
        bus.subscribe(e -> count.incrementAndGet());

        int threads = 8;
        int perThread = 100;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done  = new CountDownLatch(threads);

        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    for (int j = 0; j < perThread; j++) {
                        bus.publish(SimulationEvent.of(SimulationEventType.VEHICLE_ARRIVED, j));
                    }
                } catch (InterruptedException ignored) {
                } finally {
                    done.countDown();
                }
            });
        }

        start.countDown();
        assertTrue(done.await(5, TimeUnit.SECONDS));
        assertEquals(threads * perThread, count.get(),
                "Sin pérdida ni doble entrega bajo concurrencia");
        pool.shutdownNow();
    }
}
