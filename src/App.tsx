import { useLiveQuery } from 'dexie-react-hooks'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AvisosProvider } from './components/Avisos'
import BotonTema from './components/BotonTema'
import NavInferior from './components/NavInferior'
import { db } from './db/db'
import { setSimboloMoneda } from './lib/formato'
import Ajustes from './pages/Ajustes'
import ClienteDetalle from './pages/ClienteDetalle'
import ClienteForm from './pages/ClienteForm'
import Clientes from './pages/Clientes'
import Inicio from './pages/Inicio'
import NuevaVenta from './pages/NuevaVenta'
import PerfumeDetalle from './pages/PerfumeDetalle'
import PerfumeForm from './pages/PerfumeForm'
import Perfumes from './pages/Perfumes'

/**
 * Cambio de pantalla: fundido de 150 ms (casi imperceptible: se usa decenas de veces al día).
 * La `key` crea un elemento nuevo en cada ruta, así la entrada se repite sin keyframes.
 */
function Pantallas() {
  const { pathname } = useLocation()
  return (
    <div
      key={pathname}
      className="transition-[opacity,transform] duration-150 ease-fuerte starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0"
    >
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/venta" element={<NuevaVenta />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/nuevo" element={<ClienteForm />} />
        <Route path="/clientes/:id" element={<ClienteDetalle />} />
        <Route path="/clientes/:id/editar" element={<ClienteForm />} />
        <Route path="/perfumes" element={<Perfumes />} />
        <Route path="/perfumes/nuevo" element={<PerfumeForm />} />
        <Route path="/perfumes/:id" element={<PerfumeDetalle />} />
        <Route path="/perfumes/:id/editar" element={<PerfumeForm />} />
        <Route path="/ajustes" element={<Ajustes />} />
      </Routes>
    </div>
  )
}

export default function App() {
  const simbolo = useLiveQuery(async () => String((await db.config.get('simboloMoneda'))?.valor ?? ''))
  if (simbolo === undefined) return null
  // El símbolo se aplica al formatear; la `key` remonta las pantallas al cambiarlo.
  setSimboloMoneda(simbolo)

  return (
    <HashRouter>
      <AvisosProvider>
      <main
        className="mx-auto max-w-xl pb-[calc(7.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.25rem,env(safe-area-inset-top))]"
        key={simbolo}
      >
        <header className="flex min-h-11 items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-muted">Decants</span>
          <BotonTema />
        </header>
        <Pantallas />
      </main>
      <NavInferior />
      </AvisosProvider>
    </HashRouter>
  )
}
