/** Componente raíz de la aplicación. Renderiza la página activa según el estado de la máquina de estados. */

import { AnimatePresence } from 'framer-motion'
import { useSimulationStore } from './store/simulation.store'
import WelcomePage from './pages/welcome/WelcomePage'
import ConfigurationPage from './pages/configuration/ConfigurationPage'
import LoadingPage from './pages/loading/LoadingPage'
import SimulationPage from './pages/simulation/SimulationPage'
import ResultsPage from './pages/results/ResultsPage'

export default function App() {
  const appState = useSimulationStore((s) => s.appState)

  return (
    <AnimatePresence mode="wait">
      {(appState === 'IDLE') && <WelcomePage key="welcome" />}
      {(appState === 'CONFIGURING') && <ConfigurationPage key="config" />}
      {(appState === 'LOADING') && <LoadingPage key="loading" />}
      {(appState === 'RUNNING' || appState === 'PAUSED' || appState === 'FINISHING') && (
        <SimulationPage key="simulation" />
      )}
      {(appState === 'RESULTS') && <ResultsPage key="results" />}
    </AnimatePresence>
  )
}
