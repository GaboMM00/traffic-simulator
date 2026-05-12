package com.trafico.simulator.simulation.routing;

import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.Route;

import java.util.List;

/**
 * Interfaz del contrato de cálculo de rutas.
 * Permite intercambiar A*, Dijkstra o el modo paralelo sin modificar el código cliente.
 * Principio Open/Closed: agregar nuevos algoritmos implementando esta interfaz.
 */
public interface RouteCalculator {

    /**
     * Calcula la ruta óptima desde el origen hasta el destino dentro de la ciudad dada.
     *
     * @param city        ciudad con el grafo de intersecciones y calles
     * @param origin      coordenada de inicio del viaje
     * @param destination coordenada de destino del viaje
     * @return ruta calculada, o ruta vacía si no existe camino
     */
    Route calculate(City city, Coordinate origin, Coordinate destination);

    /**
     * Calcula rutas para múltiples pares de origen-destino.
     * La implementación secuencial los procesa uno a uno;
     * la paralela los procesa concurrentemente.
     *
     * @param city         ciudad con el grafo
     * @param originDestPairs lista de pares [origen, destino]
     * @return lista de rutas en el mismo orden que los pares de entrada
     */
    List<Route> calculateAll(City city, List<Coordinate[]> originDestPairs);
}
