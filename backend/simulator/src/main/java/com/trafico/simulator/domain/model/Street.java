package com.trafico.simulator.domain.model;

import com.trafico.simulator.domain.enums.Direction;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Arista dirigida del grafo de la ciudad. Conecta dos intersecciones en una dirección específica.
 * El peso es siempre 1 (todas las calles tienen igual longitud en este modelo).
 * La dirección sigue el sistema Manhattan alternado definido en el prompt maestro.
 */
@Getter
@RequiredArgsConstructor
public class Street {

    /** Intersección de origen (nodo desde). */
    private final Intersection from;

    /** Intersección de destino (nodo hacia). */
    private final Intersection to;

    /** Dirección del flujo vial (NORTH, SOUTH, EAST, WEST). */
    private final Direction direction;

    /** Peso de la arista; siempre 1 en este modelo. */
    private final int weight = 1;
}
