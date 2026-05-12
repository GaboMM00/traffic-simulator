package com.trafico.simulator.simulation.sync;

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
 * Tests para IntersectionLock: exclusión mutua, tryLock no bloqueante,
 * tracking de holders/waiters y marcado de víctimas para deadlock.
 */
class IntersectionLockTest {

    private IntersectionLock lock;

    @BeforeEach
    void setUp() {
        lock = new IntersectionLock();
    }

    @Test
    @DisplayName("tryLock retorna true cuando libre y false cuando otro hilo lo posee")
    void tryLockMutualExclusion() throws InterruptedException {
        assertTrue(lock.tryLock("I-0-0"));

        AtomicInteger result = new AtomicInteger(-1);
        Thread other = new Thread(() -> result.set(lock.tryLock("I-0-0") ? 1 : 0));
        other.start();
        other.join();

        assertEquals(0, result.get(), "Otro hilo no debe poder adquirir el lock ya tomado");
        lock.unlock("I-0-0");
    }

    @Test
    @DisplayName("Locks de intersecciones distintas son independientes (concurrencia real)")
    void differentIntersectionsAreIndependent() throws InterruptedException {
        assertTrue(lock.tryLock("I-0-0"));

        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger acquired = new AtomicInteger(0);
        Thread other = new Thread(() -> {
            if (lock.tryLock("I-1-1")) acquired.incrementAndGet();
            latch.countDown();
        });
        other.start();
        latch.await(1, TimeUnit.SECONDS);
        assertEquals(1, acquired.get());

        lock.unlock("I-0-0");
        lock.unlock("I-1-1");
    }

    @Test
    @DisplayName("unlock solo libera si el hilo actual posee el lock")
    void unlockSafelyIgnoresNonHolder() {
        // Otro hilo lo adquiere
        Thread holder = new Thread(() -> lock.tryLock("I-0-0"));
        holder.start();
        try { holder.join(); } catch (InterruptedException ignored) {}

        // Este hilo intenta liberar — debe ser un no-op silencioso
        assertDoesNotThrow(() -> lock.unlock("I-0-0"));
    }

    @Test
    @DisplayName("registerHolder/clearHolder mantiene el mapa de ocupación")
    void holderTracking() {
        lock.registerHolder("I-2-3", "V-001");
        assertEquals("V-001", lock.getHeldBy().get("I-2-3"));

        lock.clearHolder("I-2-3");
        assertNull(lock.getHeldBy().get("I-2-3"));
    }

    @Test
    @DisplayName("registerWait/clearWait mantiene el mapa de esperas")
    void waitTracking() {
        lock.registerWait("V-001", "I-1-1");
        assertEquals("I-1-1", lock.getWaitingFor().get("V-001"));

        lock.clearWait("V-001");
        assertFalse(lock.getWaitingFor().containsKey("V-001"));
    }

    @Test
    @DisplayName("markAsVictim/clearVictim/isMarkedAsVictim funcionan correctamente")
    void victimManagement() {
        assertFalse(lock.isMarkedAsVictim("V-001"));
        lock.markAsVictim("V-001");
        assertTrue(lock.isMarkedAsVictim("V-001"));
        lock.clearVictim("V-001");
        assertFalse(lock.isMarkedAsVictim("V-001"));
    }

    @Test
    @DisplayName("Bajo contención de N hilos, exactamente uno tiene éxito en tryLock")
    void contentionExactlyOneSucceeds() throws InterruptedException {
        int threads = 16;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done  = new CountDownLatch(threads);
        AtomicInteger successes = new AtomicInteger(0);
        List<Thread> winners   = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    if (lock.tryLock("I-X")) {
                        successes.incrementAndGet();
                        synchronized (winners) { winners.add(Thread.currentThread()); }
                    }
                } catch (InterruptedException ignored) {
                } finally {
                    done.countDown();
                }
            });
        }

        start.countDown();
        assertTrue(done.await(2, TimeUnit.SECONDS));
        assertEquals(1, successes.get(), "Exactamente un hilo debe ganar el tryLock");

        pool.shutdownNow();
    }

    @Test
    @DisplayName("getHeldBy y getWaitingFor retornan vistas de solo lectura")
    void mapsAreReadOnly() {
        lock.registerHolder("I-0-0", "V-001");
        lock.registerWait("V-002", "I-0-0");
        assertThrows(UnsupportedOperationException.class,
                () -> lock.getHeldBy().put("X", "Y"));
        assertThrows(UnsupportedOperationException.class,
                () -> lock.getWaitingFor().put("X", "Y"));
    }
}
