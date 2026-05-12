package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.Direction;
import com.trafico.simulator.domain.valueobject.Coordinate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para City: construcción del grafo, sistema Manhattan alternado,
 * distribución de semáforos y consultas del grafo.
 */
class CityTest {

    @Test
    @DisplayName("build crea NxN intersecciones para gridSize dado")
    void createsCorrectNumberOfIntersections() {
        City city = City.build(8);
        assertEquals(64, city.getIntersections().size());

        City city12 = City.build(12);
        assertEquals(144, city12.getIntersections().size());
    }

    @Test
    @DisplayName("Filas pares fluyen OESTE→ESTE; impares ESTE→OESTE")
    void horizontalStreetsAlternateByRow() {
        City city = City.build(4);

        // Fila 0 (par): (0,0) tiene calle saliente EAST hacia (1,0)
        Intersection a = city.getIntersection(new Coordinate(0, 0));
        assertTrue(a.getOutgoingStreets().stream()
                .anyMatch(s -> s.getDirection() == Direction.EAST
                        && s.getTo().getCoordinate().equals(new Coordinate(1, 0))));

        // Fila 1 (impar): (1,1) tiene calle saliente WEST hacia (0,1)
        Intersection b = city.getIntersection(new Coordinate(1, 1));
        assertTrue(b.getOutgoingStreets().stream()
                .anyMatch(s -> s.getDirection() == Direction.WEST
                        && s.getTo().getCoordinate().equals(new Coordinate(0, 1))));
    }

    @Test
    @DisplayName("Columnas pares fluyen NORTE→SUR; impares SUR→NORTE")
    void verticalStreetsAlternateByColumn() {
        City city = City.build(4);

        // Columna 0 (par): (0,0) tiene calle saliente SOUTH hacia (0,1)
        Intersection a = city.getIntersection(new Coordinate(0, 0));
        assertTrue(a.getOutgoingStreets().stream()
                .anyMatch(s -> s.getDirection() == Direction.SOUTH
                        && s.getTo().getCoordinate().equals(new Coordinate(0, 1))));

        // Columna 1 (impar): (1,1) tiene calle saliente NORTH hacia (1,0)
        Intersection b = city.getIntersection(new Coordinate(1, 1));
        assertTrue(b.getOutgoingStreets().stream()
                .anyMatch(s -> s.getDirection() == Direction.NORTH
                        && s.getTo().getCoordinate().equals(new Coordinate(1, 0))));
    }

    @ParameterizedTest
    @ValueSource(ints = {8, 10, 12, 16, 20})
    @DisplayName("Distribución dinámica de semáforos: ~16 para todos los gridSizes 8-20")
    void trafficLightDistributionScalesAsExpected() {
        City city = City.build(8);
        long count8  = city.getAllTrafficLights().size();
        City city12 = City.build(12);
        long count12 = city12.getAllTrafficLights().size();
        City city20 = City.build(20);
        long count20 = city20.getAllTrafficLights().size();

        // Fórmula step = ceil(gridSize/4) → 4 valores por dimensión → 16 semáforos
        assertEquals(16, count8);
        assertEquals(16, count12);
        assertEquals(16, count20);
    }

    @Test
    @DisplayName("Para pares no-esquina, cada calle es dirigida (un único arco entre intersecciones adyacentes)")
    void exactlyOneEdgePerAdjacentPair() {
        City city = City.build(6);
        // Entre (1,1) y (2,1): row=1 impar → arco único (2,1)→(1,1) WEST.
        // Se eligen nodos no-esquina para no chocar con la corrección de conectividad.
        Intersection a = city.getIntersection(new Coordinate(1, 1));
        Intersection b = city.getIntersection(new Coordinate(2, 1));
        long aToB = a.getOutgoingStreets().stream()
                .filter(s -> s.getTo().getCoordinate().equals(new Coordinate(2, 1))).count();
        long bToA = b.getOutgoingStreets().stream()
                .filter(s -> s.getTo().getCoordinate().equals(new Coordinate(1, 1))).count();
        assertEquals(0, aToB, "Fila impar: (1,1)→(2,1) NO debe existir (flujo va WEST)");
        assertEquals(1, bToA, "Fila impar: debe haber arco único (2,1)→(1,1) WEST");
    }

    @Test
    @DisplayName("Las esquinas tienen al menos 1 entrante y 1 saliente (conectividad fuerte)")
    void cornersAreStronglyConnected() {
        City city = City.build(8);
        int last = 7;
        Coordinate[] corners = {
                new Coordinate(0, 0),
                new Coordinate(last, 0),
                new Coordinate(0, last),
                new Coordinate(last, last)
        };
        for (Coordinate c : corners) {
            Intersection corner = city.getIntersection(c);
            assertFalse(corner.getOutgoingStreets().isEmpty(),
                    "Esquina " + c + " debe tener al menos 1 saliente");
            // Entrantes: contar todos los arcos del grafo que apuntan a la esquina
            long incoming = city.getIntersections().values().stream()
                    .flatMap(i -> i.getOutgoingStreets().stream())
                    .filter(s -> s.getTo().getId().equals(corner.getId()))
                    .count();
            assertTrue(incoming >= 1, "Esquina " + c + " debe tener al menos 1 entrante");
        }
    }

    @Test
    @DisplayName("getBorderIntersections retorna solo nodos del borde")
    void borderIntersectionsAreCorrect() {
        City city = City.build(4);
        List<Intersection> borders = city.getBorderIntersections();
        // 4×4 grid: 16 nodos, 12 son borde, 4 internos
        assertEquals(12, borders.size());
        for (Intersection i : borders) {
            assertTrue(i.getCoordinate().isBorder(4));
        }
    }

    @Test
    @DisplayName("getStreetTo encuentra la calle directa al destino")
    void streetToReturnsCorrectStreet() {
        City city = City.build(4);
        Intersection from = city.getIntersection(new Coordinate(0, 0));
        Intersection to   = city.getIntersection(new Coordinate(1, 0));

        Street street = from.getStreetTo(to);
        assertNotNull(street);
        assertEquals(Direction.EAST, street.getDirection());
        assertEquals(from, street.getFrom());
        assertEquals(to,   street.getTo());

        // No existe calle directa de (0,0) a (5,5)
        Intersection far = city.getIntersection(new Coordinate(3, 3));
        assertNull(from.getStreetTo(far));
    }

    @Test
    @DisplayName("getOutgoingStreets retorna lista inmutable")
    void outgoingStreetsAreImmutable() {
        City city = City.build(4);
        Intersection i = city.getIntersection(new Coordinate(0, 0));
        assertThrows(UnsupportedOperationException.class,
                () -> i.getOutgoingStreets().clear());
    }

    @Test
    @DisplayName("Conectividad: cada nodo es alcanzable desde cualquier borde via BFS")
    void everyNodeReachableFromAnyBorder() {
        City city = City.build(6);
        Intersection start = city.getIntersection(new Coordinate(0, 0));
        // BFS sencillo
        java.util.Set<String> visited = new java.util.HashSet<>();
        java.util.Queue<Intersection> queue = new java.util.ArrayDeque<>();
        queue.add(start); visited.add(start.getId());
        while (!queue.isEmpty()) {
            Intersection cur = queue.poll();
            for (Street s : cur.getOutgoingStreets()) {
                if (visited.add(s.getTo().getId())) queue.add(s.getTo());
            }
        }
        assertEquals(36, visited.size(),
                "El sistema Manhattan alternado debe garantizar conectividad total");
    }

    @Test
    @DisplayName("Las intersecciones esquina del grid 4x4 tienen exactamente las direcciones esperadas")
    void cornerIntersectionsDirections() {
        City city = City.build(4);
        // (0,0): puede salir EAST (fila par) y SOUTH (col par)
        List<Direction> dirs = city.getIntersection(new Coordinate(0, 0))
                .getOutgoingStreets().stream().map(Street::getDirection).toList();
        assertTrue(dirs.contains(Direction.EAST));
        assertTrue(dirs.contains(Direction.SOUTH));
        assertEquals(2, dirs.size());
    }

    @Test
    @DisplayName("hasTrafficLight devuelve true solo en intersecciones del patrón step")
    void trafficLightAtExpectedPositions() {
        City city = City.build(12); // step = ceil(12/4) = 3
        // (0,0), (0,3), (0,6), (0,9) deberían tener semáforo
        assertTrue(city.getIntersection(new Coordinate(0, 0)).hasTrafficLight());
        assertTrue(city.getIntersection(new Coordinate(3, 3)).hasTrafficLight());
        assertTrue(city.getIntersection(new Coordinate(9, 9)).hasTrafficLight());
        // (1,1) no es múltiplo de step=3
        assertFalse(city.getIntersection(new Coordinate(1, 1)).hasTrafficLight());
    }

    @Test
    @DisplayName("getMostCongestedIntersection retorna la de mayor waitCount")
    void mostCongestedIntersectionIsTheTopWaiter() {
        City city = City.build(4);
        Intersection a = city.getIntersection(new Coordinate(1, 1));
        Intersection b = city.getIntersection(new Coordinate(2, 2));
        a.recordVehicleWait();
        a.recordVehicleWait();
        a.recordVehicleWait();
        b.recordVehicleWait();

        Intersection top = Optional.ofNullable(city.getMostCongestedIntersection()).orElseThrow();
        assertEquals(a.getId(), top.getId());
    }
}
