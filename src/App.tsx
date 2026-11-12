import { useLiveQuery } from 'dexie-react-hooks'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import NavInferior from './components/NavInferior'
import { db } from './db/db'
import { setSimboloMoneda } from './lib/formato'
import { necesitaRespaldo } from './lib/respaldo'
import Ajustes from './pages/Ajustes'
import ClienteDetalle from './pages/ClienteDetalle'
import ClienteForm from './pages/ClienteForm'
import Clientes from './pages/Clientes'
import Inicio from './pages/Inicio'
import NuevaVenta from './pages/NuevaVenta'
import PerfumeDetalle from './pages/PerfumeDetalle'
import PerfumeForm from './pages/PerfumeForm'
import Perfumes from './pages/Perfumes'

export default function App() {
  const estado = useLiveQuery(async () => {
    const [config, clientes, perfumes] = await Promise.all([
      db.config.toArray(),
      db.clientes.toArray(),
      db.perfumes.toArray(),
    ])
    const valor = (k: string) => config.find((c) => c.clave === k)?.valor
    return {
      simbolo: String(valor('simboloMoneda') ?? ''),
      ultimo: typeof valor('ultimoRespaldo') === 'string' ? (valor('ultimoRespaldo') as string) : undefined,
      fechas: [...clientes, ...perfumes].map((x) => x.creadoEn),
    }
  })
  if (!estado) return null
  // El símbolo se aplica al formatear; la `key` remonta las pantallas al cambiarlo.
  setSimboloMoneda(estado.simbolo)
  const avisar = necesitaRespaldo(estado.ultimo, estado.fechas)

  return (
    <HashRouter>
      <main className="mx-auto max-w-xl p-4 pb-28" key={estado.simbolo}>
        {avisar && (
          <Link
            to="/ajustes"
            className="mb-4 block rounded-lg bg-amber-100 p-3 text-sm text-amber-900"
          >
            Hace más de 7 días que no exportas un respaldo. Toca aquí para hacerlo.
          </Link>
        )}
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
      </main>
      <NavInferior />
    </HashRouter>
  )
}
