package com.trafico.simulator.simulation.sync;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Gestiona los locks de grano fino por intersección para evitar colisiones entre vehículos.
 * Cada intersección tiene su propio ReentrantLock independiente, lo que permite
 * que vehículos en intersecciones distintas avancen concurrentemente sin bloquearse.
 *
 * Diseño deliberado: UN lock por intersección en lugar de un lock global,
 * para maximizar la concurrencia real y minimizar la contención.
 *
 * También mantiene mapas de seguimiento (holder / waitingFor) para que
 * DeadlockDetector pueda construir el grafo de espera y detectar ciclos.
 */
@Slf4j
@Component
public class IntersectionLock {

    /**
     * Mapa de locks indexados por ID de intersección.
     * ConcurrentHashMap para acceso thread-safe al crear locks nuevos.
     */
    private final Map<String, ReentrantLock> locks = new ConcurrentHashMap<>();

    /** Qué vehículo ocupa actualmente cada intersección (intersectionId → vehicleId). */
    private final Map<String, String> heldBy = new ConcurrentHashMap<>();

    /** Qué intersección espera adquirir cada vehículo (vehicleId → intersectionId). */
    private final Map<String, String> waitingFor = new ConcurrentHashMap<>();

    /**
     * Vehículos marcados como víctimas de resolución de deadlock.
     * VehicleThread consulta esta marca en su bucle de reintento y, si está marcado,
     * abandona el paso actual para romper el ciclo.
     */
    private final Set<String> victimVehicles = ConcurrentHashMap.newKeySet();

    /**
     * Adquiere el lock de la intersección dada. Bloquea si otro vehículo la está ocupando.
     *
     * @param intersectionId identificador de la intersección a bloquear
     */
    public void lock(String intersectionId) {
        getLockFor(intersectionId).lock();
        log.trace("Lock adquirido en intersección {}", intersectionId);
    }

    /**
     * Libera el lock de la intersección dada. Debe llamarse siempre en bloque finally.
     *
     * @param intersectionId identificador de la intersección a liberar
     */
    public void unlock(String intersectionId) {
        ReentrantLock lock = locks.get(intersectionId);
        if (lock != null && lock.isHeldByCurrentThread()) {
            lock.unlock();
            log.trace("Lock liberado en intersección {}", intersectionId);
        }
    }

    /**
     * Intenta adquirir el lock sin bloquear.
     *
     * @param intersectionId identificador de la intersección
     * @return true si se adquirió el lock, false si ya está ocupado
     */
    public boolean tryLock(String intersectionId) {
        return getLockFor(intersectionId).tryLock();
    }

    // ──────────────────────────────────────────────────────────────
    // Métodos de tracking para DeadlockDetector
    // ──────────────────────────────────────────────────────────────

    /**
     * Registra que un vehículo está intentando adquirir una intersección.
     * Llamado por VehicleThread antes de entrar al bucle de reintento.
     */
    public void registerWait(String vehicleId, String intersectionId) {
        waitingFor.put(vehicleId, intersectionId);
    }

    /**
     * Elimina el registro de espera de un vehículo (adquirió el lock o abandonó).
     */
    public void clearWait(String vehicleId) {
        waitingFor.remove(vehicleId);
    }

    /**
     * Registra que un vehículo ahora ocupa una intersección.
     */
    public void registerHolder(String intersectionId, String vehicleId) {
        heldBy.put(intersectionId, vehicleId);
    }

    /**
     * Elimina el registro de ocupación de una intersección (vehículo se fue).
     */
    public void clearHolder(String intersectionId) {
        heldBy.remove(intersectionId);
    }

    /**
     * Marca un vehículo como víctima de resolución de deadlock.
     * VehicleThread lo consulta y abandona su espera actual al detectarlo.
     */
    public void markAsVictim(String vehicleId) {
        victimVehicles.add(vehicleId);
        log.warn("Vehículo {} marcado como víctima de deadlock", vehicleId);
    }

    /**
     * Elimina la marca de víctima una vez que el vehículo la procesó.
     */
    public void clearVictim(String vehicleId) {
        victimVehicles.remove(vehicleId);
    }

    /** Consulta si el vehículo está marcado como víctima pendiente de resolución. */
    public boolean isMarkedAsVictim(String vehicleId) {
        return victimVehicles.contains(vehicleId);
    }

    /** Vista de solo lectura del mapa de ocupación (intersectionId → vehicleId). */
    public Map<String, String> getHeldBy() {
        return Collections.unmodifiableMap(heldBy);
    }

    /** Vista de solo lectura del mapa de espera (vehicleId → intersectionId). */
    public Map<String, String> getWaitingFor() {
        return Collections.unmodifiableMap(waitingFor);
    }

    /**
     * Obtiene o crea el lock para una intersección dada.
     * computeIfAbsent garantiza que solo se crea un lock por intersección.
     */
    private ReentrantLock getLockFor(String intersectionId) {
        return locks.computeIfAbsent(intersectionId, id -> new ReentrantLock(true));
    }
}
