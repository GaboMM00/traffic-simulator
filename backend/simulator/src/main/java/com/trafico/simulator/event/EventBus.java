package com.trafico.simulator.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * Bus de eventos interno para comunicación desacoplada entre componentes.
 * Los publicadores no conocen a los suscriptores; solo publican eventos.
 * CopyOnWriteArrayList garantiza iteración thread-safe sin bloquear publicaciones.
 */
@Slf4j
@Component
public class EventBus {

    /**
     * Lista de consumidores registrados.
     * CopyOnWriteArrayList porque las suscripciones se realizan al inicio
     * y las publicaciones ocurren con alta frecuencia desde múltiples hilos.
     */
    private final List<Consumer<SimulationEvent>> subscribers = new CopyOnWriteArrayList<>();

    /**
     * Registra un nuevo suscriptor que recibirá todos los eventos publicados.
     *
     * @param subscriber función consumidora que procesa cada evento
     */
    public void subscribe(Consumer<SimulationEvent> subscriber) {
        subscribers.add(subscriber);
        log.debug("Nuevo suscriptor registrado. Total: {}", subscribers.size());
    }

    /**
     * Publica un evento a todos los suscriptores registrados.
     * Si un suscriptor lanza excepción, se registra y se continúa con los demás.
     *
     * @param event evento a distribuir
     */
    public void publish(SimulationEvent event) {
        log.trace("Publicando evento: {} at {}ms", event.getType(), event.getTimestamp());
        for (Consumer<SimulationEvent> subscriber : subscribers) {
            try {
                subscriber.accept(event);
            } catch (Exception e) {
                log.error("Error en suscriptor al procesar evento {}: {}", event.getType(), e.getMessage());
            }
        }
    }

    /**
     * Elimina todos los suscriptores (se llama al resetear la simulación).
     */
    public void clearSubscribers() {
        subscribers.clear();
    }
}
