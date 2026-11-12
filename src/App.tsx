import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavInferior from './components/NavInferior'
import Ajustes from './pages/Ajustes'
import Clientes from './pages/Clientes'
import Inicio from './pages/Inicio'
import NuevaVenta from './pages/NuevaVenta'
import PerfumeDetalle from './pages/PerfumeDetalle'
import PerfumeForm from './pages/PerfumeForm'
import Perfumes from './pages/Perfumes'

export default function App() {
  return (
    <BrowserRouter>
      <main className="mx-auto max-w-xl p-4 pb-28">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/venta" element={<NuevaVenta />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/perfumes" element={<Perfumes />} />
          <Route path="/perfumes/nuevo" element={<PerfumeForm />} />
          <Route path="/perfumes/:id" element={<PerfumeDetalle />} />
          <Route path="/perfumes/:id/editar" element={<PerfumeForm />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Routes>
      </main>
      <NavInferior />
    </BrowserRouter>
  )
}
