import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconoAjustes, IconoClientes, IconoInicio, IconoMas, IconoPerfumes } from './Iconos'

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium ${
    isActive ? 'text-accent-text' : 'text-muted'
  }`

function Tab({ to, icono, children, fin }: { to: string; icono: ReactNode; children: string; fin?: boolean }) {
  return (
    <NavLink to={to} end={fin} className={tab}>
      {icono}
      <span>{children}</span>
    </NavLink>
  )
}

export default function NavInferior() {
  const { pathname } = useLocation()
  // Armar una venta es un flujo propio: la barra fija de la venta ocupa ese lugar
  if (pathname === '/venta') return null
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <Tab to="/" icono={<IconoInicio />} fin>
        Inicio
      </Tab>
      <Tab to="/clientes" icono={<IconoClientes />}>
        Clientes
      </Tab>
      <div className="flex flex-1 items-center justify-center">
        <NavLink
          to="/venta"
          aria-label="Nueva venta"
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg ring-4 ring-surface"
        >
          <IconoMas />
        </NavLink>
      </div>
      <Tab to="/perfumes" icono={<IconoPerfumes />}>
        Perfumes
      </Tab>
      <Tab to="/ajustes" icono={<IconoAjustes />}>
        Ajustes
      </Tab>
    </nav>
  )
}
