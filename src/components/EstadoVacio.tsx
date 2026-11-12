import { Link } from 'react-router-dom'

interface Props {
  titulo: string
  texto: string
  accion?: { etiqueta: string; to: string }
}

/** Pantalla sin datos: dice qué hacer primero, con un botón que lo hace. */
export default function EstadoVacio({ titulo, texto, accion }: Props) {
  return (
    <div className="mt-6 rounded-xl bg-surface p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mt-1 text-sm text-muted">{texto}</p>
      {accion && (
        <Link
          to={accion.to}
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-on-primary"
        >
          {accion.etiqueta}
        </Link>
      )}
    </div>
  )
}
