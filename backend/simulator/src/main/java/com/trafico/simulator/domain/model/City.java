package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.Direction;
import com.trafico.simulator.domain.valueobject.Coordinate;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Representa la ciudad completa como un grafo dirigido de intersecciones conectadas por calles.
 * Se genera algorítmicamente en base al gridSize usando el sistema Manhattan alternado:
 *   - Filas pares → calles horizontales de OESTE a ESTE
 *   - Filas impares → calles horizontales de ESTE a OESTE
 *   - Columnas pares → calles verticales de NORTE a SUR
 *   - Columnas impares → calles verticales de SUR a NORTE
 * Este sistema garantiza que siempre existe una ruta entre cualquier par de nodos.
 */
@Slf4j
@Getter
public class City {

    /** Tamaño del grid cuadrado (número de intersecciones por lado). */
    private final int gridSize;

    /**
     * Mapa de todas las intersecciones indexadas por su ID "I-{col}-{row}".
     * ConcurrentHashMap para acceso seguro desde múltiples hilos de vehículos.
     */
    private final Map<String, Intersection> intersections = new ConcurrentHashMap<>();

    /**
     * Constructor privado. Usar el método de fábrica {@link #build(int)}.
     *
     * @param gridSize tamaño del lado del grid cuadrado
     */
    private City(int gridSize) {
        this.gridSize = gridSize;
    }

    /**
     * Construye una ciudad completa con el tamaño de grid indicado.
     * Crea todas las intersecciones, las conecta con calles dirigidas según el sistema
     * Manhattan alternado, y asigna semáforos a las intersecciones pares-pares.
     *
     * @param gridSize tamaño del lado del grid (número de intersecciones por lado)
     * @return ciudad completamente inicializada y lista para la simulación
     */
    public static City build(int gridSize) {
        City city = new City(gridSize);
        city.createIntersections();
        city.connectIntersections();
        city.ensureStrongConnectivity();
        city.assignTrafficLights();
        long lightCount = city.intersections.values().stream().filter(Intersection::hasTrafficLight).count();
        log.info("Ciudad construida: {}×{} → {} intersecciones, {} semáforos",
                gridSize, gridSize, city.intersections.size(), lightCount);
        return city;
    }

    /**
     * Paso 1: crea un nodo Intersection por cada posición (col, row) del grid.
     */
    private void createIntersections() {
        for (int row = 0; row < gridSize; row++) {
            for (int col = 0; col < gridSize; col++) {
                Coordinate coord = new Coordinate(col, row);
                intersections.put(coord.toIntersectionId(), new Intersection(coord));
            }
        }
    }

    /**
     * Paso 2: conecta intersecciones adyacentes con calles dirigidas según el sistema Manhattan alternado.
     * Para cada par de nodos horizontales o verticales se crea exactamente una calle (un arco dirigido).
     */
    private void connectIntersections() {
        for (int row = 0; row < gridSize; row++) {
            for (int col = 0; col < gridSize; col++) {
                Intersection current = get(col, row);

                // Conexión horizontal: par (col, row) ↔ (col+1, row)
                if (col + 1 < gridSize) {
                    Intersection east = get(col + 1, row);
                    if (row % 2 == 0) {
                        // Fila par → flujo de OESTE a ESTE
                        current.addOutgoingStreet(new Street(current, east, Direction.EAST));
                    } else {
                        // Fila impar → flujo de ESTE a OESTE
                        east.addOutgoingStreet(new Street(east, current, Direction.WEST));
                    }
                }

                // Conexión vertical: par (col, row) ↔ (col, row+1)
                if (row + 1 < gridSize) {
                    Intersection south = get(col, row + 1);
                    if (col % 2 == 0) {
                        // Columna par → flujo de NORTE a SUR
                        current.addOutgoingStreet(new Street(current, south, Direction.SOUTH));
                    } else {
                        // Columna impar → flujo de SUR a NORTE
                        south.addOutgoingStreet(new Street(south, current, Direction.NORTH));
                    }
                }
            }
        }
    }

    /**
     * Paso 2.5: garantiza conectividad fuerte añadiendo arcos en las esquinas.
     * El patrón Manhattan alternado puro produce esquinas que son fuente o sumidero
     * (sin entrantes o sin salientes), lo que rompe la promesa del prompt maestro de
     * "siempre existe ruta entre cualquier par de nodos". Este paso lo corrige
     * añadiendo el arco mínimo necesario en cada esquina problemática.
     */
    private void ensureStrongConnectivity() {
        int last = gridSize - 1;
        int[][] corners = {{0, 0}, {last, 0}, {0, last}, {last, last}};
        for (int[] c : corners) {
            Intersection corner = get(c[0], c[1]);
            ensureHasOutgoing(corner, c[0], c[1]);
            ensureHasIncoming(corner, c[0], c[1]);
        }
    }

    /**
     * Si la esquina no tiene salientes, añade uno hacia un vecino (preferentemente vertical).
     */
    private void ensureHasOutgoing(Intersection corner, int col, int row) {
        if (!corner.getOutgoingStreets().isEmpty()) return;
        if (row < gridSize - 1) {
            corner.addOutgoingStreet(new Street(corner, get(col, row + 1), Direction.SOUTH));
        } else {
            corner.addOutgoingStreet(new Street(corner, get(col, row - 1), Direction.NORTH));
        }
    }

    /**
     * Si la esquina no tiene entrantes, añade uno desde un vecino horizontal.
     * Recorre todas las intersecciones para detectar entrantes existentes; coste O(N²)
     * aceptable porque solo se invoca 4 veces (una por esquina) durante la construcción.
     */
    private void ensureHasIncoming(Intersection corner, int col, int row) {
        if (hasIncomingStreet(corner)) return;
        if (col > 0) {
            Intersection west = get(col - 1, row);
            west.addOutgoingStreet(new Street(west, corner, Direction.EAST));
        } else {
            Intersection east = get(col + 1, row);
            east.addOutgoingStreet(new Street(east, corner, Direction.WEST));
        }
    }

    private boolean hasIncomingStreet(Intersection target) {
        for (Intersection i : intersections.values()) {
            for (Street s : i.getOutgoingStreets()) {
                if (s.getTo().getId().equals(target.getId())) return true;
            }
        }
        return false;
    }

    /**
     * Paso 3: asigna semáforos usando un paso dinámico para mantener siempre ~16 semáforos (4×4).
     * Fórmula: step = ceil(gridSize / 4), con un semáforo en cada (col, row) múltiplo de step.
     * Resultados: grid 8→step=2 (16), 12→step=3 (16), 16→step=4 (16), 20→step=5 (16).
     * Esto "escala automáticamente" como indica el prompt y cumple el requisito de 10-20 semáforos.
     */
    private void assignTrafficLights() {
        final int step = (int) Math.ceil(gridSize / 4.0);
        intersections.values().stream()
                .filter(i -> i.getCoordinate().getCol() % step == 0
                        && i.getCoordinate().getRow() % step == 0)
                .forEach(i -> i.setTrafficLight(new TrafficLight(i.getId())));
    }

    // ──────────────────────────────────────────────────────────────
    // Métodos de consulta del grafo
    // ──────────────────────────────────────────────────────────────

    /**
     * Obtiene una intersección por su coordenada.
     *
     * @param coordinate coordenada de la intersección
     * @return intersección en esa posición, o null si no existe
     */
    public Intersection getIntersection(Coordinate coordinate) {
        return intersections.get(coordinate.toIntersectionId());
    }

    /**
     * Obtiene una intersección por su ID.
     *
     * @param id identificador en formato "I-{col}-{row}"
     * @return intersección con ese ID, o null si no existe
     */
    public Intersection getIntersectionById(String id) {
        return intersections.get(id);
    }

    /**
     * Retorna todas las intersecciones del borde del grid.
     * Los vehículos solo pueden originarse en estas intersecciones.
     *
     * @return lista de intersecciones en el borde del grid
     */
    public List<Intersection> getBorderIntersections() {
        List<Intersection> borders = new ArrayList<>();
        for (int col = 0; col < gridSize; col++) {
            for (int row = 0; row < gridSize; row++) {
                if (col == 0 || col == gridSize - 1 || row == 0 || row == gridSize - 1) {
                    Intersection intersection = get(col, row);
                    if (intersection != null) {
                        borders.add(intersection);
                    }
                }
            }
        }
        return borders;
    }

    /**
     * Retorna todos los semáforos de la ciudad, para iniciar sus hilos.
     *
     * @return lista de semáforos activos
     */
    public List<TrafficLight> getAllTrafficLights() {
        return intersections.values().stream()
                .filter(Intersection::hasTrafficLight)
                .map(Intersection::getTrafficLight)
                .collect(Collectors.toList());
    }

    /**
     * Retorna la intersección más congestionada (con más esperas acumuladas).
     * Se invoca desde MetricsCollector para determinar el punto crítico del tráfico.
     *
     * @return intersección con el mayor waitCount, o null si no hay intersecciones
     */
    public Intersection getMostCongestedIntersection() {
        return intersections.values().stream()
                .max((a, b) -> Integer.compare(a.getWaitCount().get(), b.getWaitCount().get()))
                .orElse(null);
    }

    /** Acceso directo a intersección por coordenadas enteras (uso interno). */
    private Intersection get(int col, int row) {
        return intersections.get(new Coordinate(col, row).toIntersectionId());
    }
}
