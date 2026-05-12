package com.trafico.simulator.simulation;

import com.trafico.simulator.domain.enums.ExecutionMode;
import com.trafico.simulator.domain.model.City;
import com.trafico.simulator.domain.model.Intersection;
import com.trafico.simulator.domain.model.Vehicle;
import com.trafico.simulator.domain.valueobject.Coordinate;
import com.trafico.simulator.domain.valueobject.SimulationParams;
import com.trafico.simulator.event.EventBus;
import com.trafico.simulator.simulation.routing.AStarRouteCalculator;
import com.trafico.simulator.simulation.routing.ParallelRouteCalculator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ForkJoinPool;

/**
 * Orquestador principal que inicia y controla DOS simulaciones simultáneas:
 * una en modo SEQUENTIAL y otra en modo PARALLEL, usando los mismos pares
 * origen-destino para garantizar una comparación justa.
 *
 * Cada simulación vive en su propio {@link SimulationRunner} con ciudad,
 * vehículos y estado independientes. Simulator solo coordina el arranque,
 * el benchmark de rutas (medido una sola vez para ambos modos) y la
 * delegación de las operaciones de control (pause/resume/stop/setSpeed).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Simulator {

    private static final long TIMER_INTERVAL_MS        = 10L;
    private static final int  ROUTE_BENCHMARK_SAMPLE   = 30;
    private static final int  BENCHMARK_WARMUP_ROUNDS  = 3;
    private static final int  BENCHMARK_MEASURE_ROUNDS = 5;
    private static final DateTimeFormatter SIM_ID_FMT  =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final EventBus                eventBus;
    private final AStarRouteCalculator    aStarCalculator;
    private final ParallelRouteCalculator parallelCalculator;

    @Getter private volatile SimulationRunner seqRunner;
    @Getter private volatile SimulationRunner parRunner;
    @Getter private volatile String           simulationId;

    /**
     * Inicia las dos simulaciones (SEQ y PAR) con los parámetros dados.
     *
     * Secuencia:
     * 1. Detener runners anteriores
     * 2. Generar pares origen-destino (mismo conjunto para ambos runners)
     * 3. Medir T_seq y T_par con warm-up + nanoTime + mediana
     * 4. Construir dos ciudades independientes (misma topología determinista)
     * 5. Crear dos conjuntos de vehículos equivalentes (mismos IDs, mismas coords)
     * 6. Arrancar seqRunner (SEQUENTIAL) y parRunner (PARALLEL)
     *
     * @param params parámetros comunes de configuración
     * @return ID de la simulación creada
     */
    public String start(SimulationParams params) {
        log.info("Iniciando simulación dual: gridSize={}, vehicleCount={}",
                params.getGridSize(), params.getVehicleCount());

        stopRunners();

        simulationId = "SIM-" + LocalDateTime.now().format(SIM_ID_FMT);

        // Ciudad plantilla para generar pares y hacer el benchmark
        City templateCity = City.build(params.getGridSize());
        List<Coordinate[]> pairs = generatePairs(params, templateCity);

        // Benchmark de rutas (siempre ambos modos; nanoTime + warm-up + mediana)
        long[] benchTimes = medirTiemposRuta(templateCity, pairs);
        long seqBenchMs = benchTimes[0];
        long parBenchMs = benchTimes[1];

        // Dos ciudades con topología idéntica (City.build es determinista dado el gridSize)
        City seqCity = City.build(params.getGridSize());
        City parCity = City.build(params.getGridSize());

        // Dos conjuntos de vehículos equivalentes (mismos pares origen-destino, objetos distintos)
        List<Vehicle> seqVehicles = createVehiclesFromPairs(pairs);
        List<Vehicle> parVehicles = createVehiclesFromPairs(pairs);

        // Crear runners
        seqRunner = new SimulationRunner(ExecutionMode.SEQUENTIAL, aStarCalculator, eventBus);
        parRunner = new SimulationRunner(ExecutionMode.PARALLEL,   aStarCalculator, eventBus);

        // Inyectar tiempos de benchmark en ambos estados antes de arrancar
        seqRunner.getState().setSequentialRouteTimeMs(seqBenchMs);
        seqRunner.getState().setParallelRouteTimeMs(parBenchMs);
        parRunner.getState().setSequentialRouteTimeMs(seqBenchMs);
        parRunner.getState().setParallelRouteTimeMs(parBenchMs);

        seqRunner.start(simulationId, params, seqCity, seqVehicles);
        parRunner.start(simulationId, params, parCity, parVehicles);

        log.info("Simulación {} arrancada en modo dual (SEQ + PAR)", simulationId);
        return simulationId;
    }

    /** Pausa ambas simulaciones. */
    public void pause() {
        if (seqRunner != null) seqRunner.pause();
        if (parRunner != null) parRunner.pause();
    }

    /** Reanuda ambas simulaciones. */
    public void resume() {
        if (seqRunner != null) seqRunner.resume();
        if (parRunner != null) parRunner.resume();
    }

    /** Detiene ambas simulaciones y libera recursos. */
    public void stop() {
        if (seqRunner != null) seqRunner.stop();
        if (parRunner != null) parRunner.stop();
    }

    /** Actualiza la velocidad de ambas simulaciones en tiempo real. */
    public void setSpeed(double speed) {
        if (seqRunner != null) seqRunner.setSpeed(speed);
        if (parRunner != null) parRunner.setSpeed(speed);
    }

    /** True si al menos uno de los runners está activo. */
    public boolean isRunning() {
        return (seqRunner != null && seqRunner.getState().isRunning())
            || (parRunner != null && parRunner.getState().isRunning());
    }

    /** True si los runners están activos y en pausa. */
    public boolean isPaused() {
        return seqRunner != null && seqRunner.getState().isPaused();
    }

    // ──────────────────────────────────────────────────────────────
    // Privados
    // ──────────────────────────────────────────────────────────────

    private void stopRunners() {
        if (seqRunner != null) { seqRunner.stop(); seqRunner = null; }
        if (parRunner != null) { parRunner.stop(); parRunner = null; }
    }

    /**
     * Genera pares origen-destino aleatorios usando la ciudad plantilla.
     * El mismo conjunto de pares se usa para ambos runners (comparación justa).
     */
    private List<Coordinate[]> generatePairs(SimulationParams params, City templateCity) {
        List<Intersection> borders = templateCity.getBorderIntersections();
        List<Intersection> all     = new ArrayList<>(templateCity.getIntersections().values());
        Random rng = new Random();

        List<Coordinate[]> pairs = new ArrayList<>(params.getVehicleCount());
        for (int i = 0; i < params.getVehicleCount(); i++) {
            Intersection origin = borders.get(rng.nextInt(borders.size()));
            Intersection dest;
            do {
                dest = all.get(rng.nextInt(all.size()));
            } while (dest.getId().equals(origin.getId()));
            pairs.add(new Coordinate[]{origin.getCoordinate(), dest.getCoordinate()});
        }
        return pairs;
    }

    /**
     * Crea objetos Vehicle independientes a partir de los pares de coordenadas.
     * Se llama dos veces: una para seqVehicles y otra para parVehicles.
     * Los IDs y colores son idénticos; solo los objetos son distintos.
     */
    private List<Vehicle> createVehiclesFromPairs(List<Coordinate[]> pairs) {
        List<Vehicle> result = new ArrayList<>(pairs.size());
        for (int i = 0; i < pairs.size(); i++) {
            String vehicleId = String.format("V-%03d", i + 1);
            int    colorIdx  = i % 10;
            Coordinate origin = pairs.get(i)[0];
            Coordinate dest   = pairs.get(i)[1];

            Vehicle v = new Vehicle(vehicleId, colorIdx, 0L);
            v.setCurrentPosition(origin);
            v.setPreviousPosition(origin);
            v.setDestination(dest);
            result.add(v);
        }
        return result;
    }

    /**
     * Mide T_seq y T_par con metodología robusta (warm-up + nanoTime + mediana).
     *
     * @param city  ciudad usada para el benchmark (puede ser la plantilla)
     * @param pairs pares origen-destino del benchmark
     * @return long[]{seqMs, parMs} — tiempos extrapolados al total de vehículos
     */
    private long[] medirTiemposRuta(City city, List<Coordinate[]> pairs) {
        int sampleSize = Math.min(ROUTE_BENCHMARK_SAMPLE, pairs.size());
        List<Coordinate[]> sample = pairs.subList(0, sampleSize);
        double factor = (double) pairs.size() / sampleSize;

        log.info("Benchmark rutas — muestra={}/{}, FJP_workers={}, warmup={}, rounds={}",
                sampleSize, pairs.size(),
                ForkJoinPool.commonPool().getParallelism(),
                BENCHMARK_WARMUP_ROUNDS, BENCHMARK_MEASURE_ROUNDS);

        for (int w = 0; w < BENCHMARK_WARMUP_ROUNDS; w++) {
            aStarCalculator.calculateAll(city, sample);
            parallelCalculator.calculateAll(city, sample);
        }

        long[] seqNanos = new long[BENCHMARK_MEASURE_ROUNDS];
        long[] parNanos = new long[BENCHMARK_MEASURE_ROUNDS];

        for (int r = 0; r < BENCHMARK_MEASURE_ROUNDS; r++) {
            long s = System.nanoTime();
            aStarCalculator.calculateAll(city, sample);
            seqNanos[r] = System.nanoTime() - s;

            long p = System.nanoTime();
            parallelCalculator.calculateAll(city, sample);
            parNanos[r] = System.nanoTime() - p;
        }

        Arrays.sort(seqNanos);
        Arrays.sort(parNanos);
        long seqMedianNs = seqNanos[BENCHMARK_MEASURE_ROUNDS / 2];
        long parMedianNs = parNanos[BENCHMARK_MEASURE_ROUNDS / 2];

        long seqMs = Math.round(seqMedianNs * factor / 1_000_000.0);
        long parMs = Math.round(parMedianNs * factor / 1_000_000.0);

        double speedup = parMs > 0 ? (double) seqMs / parMs : 1.0;
        log.info("Benchmark completado — seq={}ms, par={}ms, speedup={} (mediana {} rondas, ×{})",
                seqMs, parMs, String.format("%.2f", speedup),
                BENCHMARK_MEASURE_ROUNDS, String.format("%.1f", factor));

        return new long[]{seqMs, parMs};
    }
}
