package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.TrafficLightState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para TrafficLight: estado inicial, allowsTraffic, gestión de cola y umbral de congestión.
 */
class TrafficLightTest {

    @Test
    @DisplayName("Inicialmente en RED, no permite tráfico, cola vacía y no extendido")
    void initialState() {
        TrafficLight light = new TrafficLight("I-0-0");
        assertEquals(TrafficLightState.RED, light.getState());
        assertFalse(light.allowsTraffic());
        assertEquals(0, light.getQueueSize().get());
        assertFalse(light.isExtended());
    }

    @Test
    @DisplayName("allowsTraffic solo es true en GREEN")
    void allowsTrafficOnlyOnGreen() {
        TrafficLight light = new TrafficLight("I-0-0");
        light.setState(TrafficLightState.GREEN);
        assertTrue(light.allowsTraffic());
        light.setState(TrafficLightState.YELLOW);
        assertFalse(light.allowsTraffic());
        light.setState(TrafficLightState.RED);
        assertFalse(light.allowsTraffic());
    }

    @Test
    @DisplayName("incrementQueue/decrementQueue actualiza el tamaño de cola")
    void queueManagement() {
        TrafficLight light = new TrafficLight("I-0-0");
        light.incrementQueue();
        light.incrementQueue();
        light.incrementQueue();
        assertEquals(3, light.getQueueSize().get());
        light.decrementQueue();
        assertEquals(2, light.getQueueSize().get());
    }

    @Test
    @DisplayName("isCongestedAbove dispara con más vehículos que el umbral")
    void congestionThreshold() {
        TrafficLight light = new TrafficLight("I-0-0");
        for (int i = 0; i < 5; i++) light.incrementQueue();
        assertFalse(light.isCongestedAbove(5), "5 no es > 5");
        light.incrementQueue();
        assertTrue(light.isCongestedAbove(5), "6 es > 5");
    }
}
