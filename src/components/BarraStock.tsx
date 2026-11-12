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
        <span className={bajo ? 'font-semibold text-red-600' : 'text-slate-600'}>
          {formatoMl(restantes)} ml
          {bajo && ' · stock bajo'}
        </span>
        <span className="text-slate-400">de {formatoMl(iniciales)} ml</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${bajo ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
