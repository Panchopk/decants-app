import { formatoMl } from '../lib/formato'

interface Props {
  restantes: number
  iniciales: number
  bajo: boolean
}

export default function BarraStock({ restantes, iniciales, bajo }: Props) {
  const pct = iniciales > 0 ? Math.max(0, Math.min(100, (restantes / iniciales) * 100)) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className={bajo ? 'font-semibold text-debt' : 'text-strong'}>
          {formatoMl(restantes)} ml
          {bajo && ' · stock bajo'}
        </span>
        <span className="text-muted">de {formatoMl(iniciales)} ml</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-sunken">
        <div
          className={`rellenar h-full w-full ${bajo ? 'bg-debt-bar' : 'bg-primary-bar'}`}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  )
}
