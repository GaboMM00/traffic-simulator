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
    @DisplayName("maxVehicles aplica fórmula min(200, gridSize*gridSize*0.4)")
    void maxVehiclesFormula() {
        ResponseEntity<Map<String, Integer>> resp = controller.maxVehicles(8);
        // 8*8*0.4 = 25.6 → 25
        assertEquals(25, resp.getBody().get("maxVehicles"));
        assertEquals(8,  resp.getBody().get("gridSize"));
    }

    @Test
    @DisplayName("maxVehicles capa el resultado a 200 para grids muy grandes")
    void maxVehiclesCappedAt200() {
        // 25*25*0.4 = 250 → cap a 200
        ResponseEntity<Map<String, Integer>> resp = controller.maxVehicles(25);
        assertEquals(200, resp.getBody().get("maxVehicles"));
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
