package com.trafico.simulator.domain.valueobject;

import lombok.Value;

import java.util.Collections;
import java.util.List;

/**
 * Ruta inmutable que representa la secuencia de coordenadas que un vehículo debe recorrer.
 * Incluye origen, destino y todos los nodos intermedios del camino calculado.
 */
@Value
public class Route {

    /** Nodo de origen del viaje. */
    Coordinate origin;

    /** Nodo destino del viaje. */
    Coordinate destination;

    /** Secuencia ordenada de coordenadas desde origen hasta destino (inclusive). */
    List<Coordinate> waypoints;

    /**
     * Crea una ruta con la secuencia de nodos dada.
     *
     * @param origin      nodo de inicio
     * @param destination nodo de destino
     * @param waypoints   lista de nodos (debe incluir origen y destino)
     * @return ruta inmutable
     */
    public static Route of(Coordinate origin, Coordinate destination, List<Coordinate> waypoints) {
        return new Route(origin, destination, Collections.unmodifiableList(waypoints));
    }

    /**
     * Crea una ruta inválida (sin nodos) para el caso en que no existe camino posible.
     *
     * @param origin      nodo de inicio
     * @param destination nodo de destino
     * @return ruta vacía que representa NO_ROUTE
     */
    public static Route empty(Coordinate origin, Coordinate destination) {
        return new Route(origin, destination, Collections.emptyList());
    }

    /**
     * Indica si existe una ruta válida entre origen y destino.
     *
     * @return true si la ruta tiene al menos un nodo
     */
    public boolean isValid() {
        return !waypoints.isEmpty();
    }

    /**
     * Retorna la longitud de la ruta en número de nodos a recorrer.
     *
     * @return cantidad de nodos en el camino
     */
    public int length() {
        return waypoints.size();
    }
}
