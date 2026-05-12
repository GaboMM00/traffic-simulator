package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.valueobject.Coordinate;
import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Nodo del grafo de la ciudad. Representa una intersección de calles en una posición (col, row).
 * Puede tener un semáforo si el criterio de distribución lo indica (col % 3 == 0 AND row % 3 == 0).
 * Lleva conteo de congestión para calcular la intersección más congestionada en métricas.
 * Las operaciones sobre el waitCount son thread-safe; la asignación de semáforo y
 * adición de calles ocurre solo durante la construcción del grafo (hilo único).
 */
@Getter
public class Intersection {

    /** Identificador único en formato "I-{col}-{row}". */
    private final String id;

    /** Posición en el grid. */
    private final Coordinate coordinate;

    /** Semáforo asociado a esta intersección, null si no tiene. */
    private TrafficLight trafficLight;

    /**
     * Calles que salen de esta intersección (aristas dirigidas del grafo).
     * Se construye durante City.build() en hilo único, por eso no necesita ser thread-safe.
     * Solo se lee desde múltiples hilos después de la construcción.
     */
    private final List<Street> outgoingStreets = new ArrayList<>();

    /** Contador de veces que un vehículo esperó en esta intersección (para métricas). */
    private final AtomicInteger waitCount = new AtomicInteger(0);

    /**
     * Crea una intersección en la coordenada dada.
     *
     * @param coordinate posición en el grid
     */
    public Intersection(Coordinate coordinate) {
        this.coordinate = coordinate;
        this.id = coordinate.toIntersectionId();
    }

    /**
     * Agrega una calle saliente a esta intersección.
     * Solo debe llamarse durante la construcción del grafo en {@link City#build(int)}.
     *
     * @param street calle dirigida que parte de esta intersección
     */
    public void addOutgoingStreet(Street street) {
        outgoingStreets.add(street);
    }

    /**
     * Asigna el semáforo a esta intersección.
     * Solo debe llamarse durante la construcción del grafo en {@link City#build(int)}.
     *
     * @param trafficLight semáforo que controla el tráfico en esta intersección
     */
    public void setTrafficLight(TrafficLight trafficLight) {
        this.trafficLight = trafficLight;
    }

    /**
     * Retorna la lista de calles salientes como vista de solo lectura.
     * Múltiples hilos de vehículos pueden leerla concurrentemente sin riesgo
     * porque la lista no se modifica después de la construcción del grafo.
     *
     * @return lista inmutable de calles salientes
     */
    public List<Street> getOutgoingStreets() {
        return Collections.unmodifiableList(outgoingStreets);
    }

    /**
     * Indica si esta intersección tiene semáforo asignado.
     *
     * @return true si existe semáforo, false en caso contrario
     */
    public boolean hasTrafficLight() {
        return trafficLight != null;
    }

    /**
     * Registra una espera de vehículo en esta intersección e incrementa el contador de congestión.
     * Thread-safe: se llama desde múltiples VehicleThreads concurrentemente.
     */
    public void recordVehicleWait() {
        waitCount.incrementAndGet();
    }

    /**
     * Busca la calle saliente que conecta con la intersección de destino dada.
     * Usado por VehicleThread para determinar la dirección del siguiente movimiento.
     *
     * @param destination intersección de destino
     * @return calle que lleva al destino, o null si no hay conexión directa
     */
    public Street getStreetTo(Intersection destination) {
        return outgoingStreets.stream()
                .filter(s -> s.getTo().getId().equals(destination.getId()))
                .findFirst()
                .orElse(null);
    }
}
