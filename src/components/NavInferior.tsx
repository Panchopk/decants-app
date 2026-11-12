import { NavLink } from 'react-router-dom'

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center py-3 text-sm font-medium ${
    isActive ? 'text-indigo-600' : 'text-slate-500'
  }`

export default function NavInferior() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-stretch border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={tab}>
        Inicio
      </NavLink>
      <NavLink to="/clientes" className={tab}>
        Clientes
      </NavLink>
      <div className="flex flex-1 items-center justify-center">
        <NavLink
          to="/venta"
          aria-label="Nueva venta"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl text-white shadow-lg"
        >
          +
        </NavLink>
      </div>
      <NavLink to="/perfumes" className={tab}>
        Perfumes
      </NavLink>
      <NavLink to="/ajustes" className={tab}>
        Ajustes
      </NavLink>
    </nav>
  )
}
