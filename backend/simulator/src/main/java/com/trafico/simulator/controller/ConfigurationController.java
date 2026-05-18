package com.trafico.simulator.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller REST que expone endpoints de configuración y validación.
 * Permite al frontend consultar el máximo de vehículos permitidos para un grid size dado
 * y los valores por defecto de la configuración.
 */
@Slf4j
@RestController
@RequestMapping("/api/configuration")
public class ConfigurationController {

    /** Tope absoluto de vehículos soportados por la simulación. */
    private static final int ABSOLUTE_MAX_VEHICLES = 2000;
    /** Densidad máxima permitida: porcentaje de intersecciones del grid ocupables por vehículos. */
    private static final double VEHICLES_PER_INTERSECTION = 0.2;

    /**
     * Retorna el número máximo de vehículos permitidos para el grid size indicado.
     * Fórmula: maxVehicles = min(ABSOLUTE_MAX_VEHICLES, gridSize² × VEHICLES_PER_INTERSECTION).
     * Ejemplos con la fórmula actual:
     *   8x8   →   12     | 20x20 →   80    | 50x50 →   500
     *   12x12 →   28     | 30x30 →  180    | 80x80 →  1280
     *   16x16 →   51     | 40x40 →  320    | 100x100 → 2000
     *
     * @param gridSize tamaño del grid cuadrado (8 a 100)
     * @return máximo de vehículos calculado
     */
    @GetMapping("/max-vehicles")
    public ResponseEntity<Map<String, Integer>> maxVehicles(@RequestParam int gridSize) {
        int max = Math.min(ABSOLUTE_MAX_VEHICLES, (int) (gridSize * gridSize * VEHICLES_PER_INTERSECTION));
        return ResponseEntity.ok(Map.of("gridSize", gridSize, "maxVehicles", max));
    }

    /**
     * Retorna los valores por defecto de configuración de la simulación.
     *
     * @return mapa con todos los parámetros y sus valores default
     */
    @GetMapping("/defaults")
    public ResponseEntity<Map<String, Object>> defaults() {
        return ResponseEntity.ok(Map.of(
                "gridSize", 12,
                "vehicleCount", 50,
                "executionMode", "PARALLEL",
                "greenDurationMs", 5000,
                "yellowDurationMs", 2000,
                "redDurationMs", 6000,
                "simulationSpeed", 1.0,
                "smartTrafficLights", false
        ));
    }
}
