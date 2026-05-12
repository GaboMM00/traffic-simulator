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

    /**
     * Retorna el número máximo de vehículos permitidos para el grid size indicado.
     * Fórmula: maxVehicles = Math.min(200, gridSize * gridSize * 0.4)
     *
     * @param gridSize tamaño del grid cuadrado (8 a 20)
     * @return máximo de vehículos calculado
     */
    @GetMapping("/max-vehicles")
    public ResponseEntity<Map<String, Integer>> maxVehicles(@RequestParam int gridSize) {
        int max = Math.min(200, (int) (gridSize * gridSize * 0.4));
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
