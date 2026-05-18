package com.trafico.simulator.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para ConfigurationController: cálculo de máximo de vehículos y defaults.
 */
class ConfigurationControllerTest {

    private final ConfigurationController controller = new ConfigurationController();

    @Test
    @DisplayName("maxVehicles aplica fórmula min(2000, gridSize*gridSize*0.2)")
    void maxVehiclesFormula() {
        ResponseEntity<Map<String, Integer>> resp = controller.maxVehicles(8);
        // 8*8*0.2 = 12.8 → 12
        assertEquals(12, resp.getBody().get("maxVehicles"));
        assertEquals(8,  resp.getBody().get("gridSize"));
    }

    @Test
    @DisplayName("maxVehicles capa el resultado a 2000 para grids extremos (≥100)")
    void maxVehiclesCappedAt2000() {
        // 100*100*0.2 = 2000 (en el límite)
        ResponseEntity<Map<String, Integer>> resp = controller.maxVehicles(100);
        assertEquals(2000, resp.getBody().get("maxVehicles"));

        // 150*150*0.2 = 4500 → cap a 2000
        ResponseEntity<Map<String, Integer>> resp2 = controller.maxVehicles(150);
        assertEquals(2000, resp2.getBody().get("maxVehicles"));
    }

    @Test
    @DisplayName("maxVehicles para grids medianos respeta la nueva densidad 0.2")
    void maxVehiclesMediumGrid() {
        // 50*50*0.2 = 500
        assertEquals(500,  controller.maxVehicles(50).getBody().get("maxVehicles"));
        // 80*80*0.2 = 1280
        assertEquals(1280, controller.maxVehicles(80).getBody().get("maxVehicles"));
    }

    @Test
    @DisplayName("defaults retorna los valores del prompt maestro")
    void defaultsReturnsExpectedValues() {
        Map<String, Object> body = controller.defaults().getBody();
        assertEquals(12,         body.get("gridSize"));
        assertEquals(50,         body.get("vehicleCount"));
        assertEquals("PARALLEL", body.get("executionMode"));
        assertEquals(5000,       body.get("greenDurationMs"));
        assertEquals(2000,       body.get("yellowDurationMs"));
        assertEquals(6000,       body.get("redDurationMs"));
        assertEquals(1.0,        body.get("simulationSpeed"));
        assertEquals(false,      body.get("smartTrafficLights"));
    }
}
