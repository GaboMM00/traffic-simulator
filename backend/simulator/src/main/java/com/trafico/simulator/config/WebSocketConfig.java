package com.trafico.simulator.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configura el broker de mensajes WebSocket con STOMP y SockJS.
 * Los clientes se conectan en /ws y se suscriben a los tópicos /topic/*.
 * SockJS provee fallback para navegadores que no soportan WebSocket nativo.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * {@inheritDoc}
     * Configura el broker en memoria con prefijo /topic y el prefijo de aplicación /app.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * {@inheritDoc}
     * Registra el endpoint /ws con SockJS habilitado y CORS para el frontend en localhost:5173.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173")
                .withSockJS();
    }
}
