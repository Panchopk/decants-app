import { db } from '../db/db'
import type { AjusteStock, Cliente, Pago, Perfume, Venta } from '../db/tipos'

export const VERSION_RESPALDO = 1

export interface Respaldo {
  version: number
  exportadoEn: string
  perfumes: Perfume[]
  clientes: Cliente[]
  ventas: Venta[]
  pagos: Pago[]
  ajustes: AjusteStock[]
  config: { clave: string; valor: string | number }[]
}

const esObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)
const esStr = (x: unknown) => typeof x === 'string' && x.length > 0
const esNum = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
const opcStr = (x: unknown) => x === undefined || typeof x === 'string'
const opcNum = (x: unknown) => x === undefined || esNum(x)

type Validador = (x: Record<string, unknown>) => boolean

const validadores: Record<string, Validador> = {
  perfumes: (x) =>
    esStr(x.id) &&
    esStr(x.nombre) &&
    opcStr(x.marca) &&
    esNum(x.mlIniciales) &&
    opcNum(x.costoBotella) &&
    Array.isArray(x.precios) &&
    x.precios.every((p) => esObj(p) && esNum(p.ml) && esNum(p.precio)) &&
    typeof x.archivado === 'boolean' &&
    esStr(x.creadoEn),
  clientes: (x) =>
    esStr(x.id) && esStr(x.nombre) && opcStr(x.telefono) && opcStr(x.nota) && esStr(x.creadoEn),
  ventas: (x) =>
    esStr(x.id) &&
    esStr(x.clienteId) &&
    esStr(x.fecha) &&
    opcStr(x.nota) &&
    Array.isArray(x.items) &&
    x.items.every(
      (i) =>
        esObj(i) && esStr(i.perfumeId) && esNum(i.ml) && esNum(i.cantidad) && esNum(i.precioUnitario),
    ) &&
    esNum(x.total) &&
    typeof x.anulada === 'boolean',
  pagos: (x) =>
    esStr(x.id) &&
    esStr(x.clienteId) &&
    esNum(x.monto) &&
    esStr(x.fecha) &&
    (x.metodo === undefined || ['efectivo', 'transferencia', 'otro'].includes(x.metodo as string)) &&
    opcStr(x.nota),
  ajustes: (x) =>
    esStr(x.id) && esStr(x.perfumeId) && esNum(x.ml) && typeof x.motivo === 'string' && esStr(x.fecha),
  config: (x) => esStr(x.clave) && (esNum(x.valor) || typeof x.valor === 'string'),
}

/** Valida el contenido de un archivo de respaldo. Devuelve el respaldo o un mensaje de error. */
export function validarRespaldo(json: unknown): { ok: true; respaldo: Respaldo } | { ok: false; error: string } {
  if (!esObj(json)) return { ok: false, error: 'El archivo no tiene el formato de un respaldo.' }
  if (json.version !== VERSION_RESPALDO) {
    return { ok: false, error: `Versión de respaldo no compatible (${String(json.version)}).` }
  }
  for (const [tabla, valido] of Object.entries(validadores)) {
    const filas = json[tabla]
    if (!Array.isArray(filas)) return { ok: false, error: `Falta la sección "${tabla}".` }
    const mala = filas.findIndex((f) => !esObj(f) || !valido(f))
    if (mala >= 0) return { ok: false, error: `Dato inválido en "${tabla}" (fila ${mala + 1}).` }
  }
  // Integridad: ventas/pagos/ajustes deben apuntar a clientes y perfumes existentes
  const clientes = new Set((json.clientes as Cliente[]).map((c) => c.id))
  const perfumes = new Set((json.perfumes as Perfume[]).map((p) => p.id))
  for (const v of json.ventas as Venta[]) {
    if (!clientes.has(v.clienteId)) return { ok: false, error: 'Una venta apunta a un cliente que no existe.' }
    if (v.items.some((i) => !perfumes.has(i.perfumeId)))
      return { ok: false, error: 'Una venta apunta a un perfume que no existe.' }
  }
  if ((json.pagos as Pago[]).some((p) => !clientes.has(p.clienteId)))
    return { ok: false, error: 'Un pago apunta a un cliente que no existe.' }
  if ((json.ajustes as AjusteStock[]).some((a) => !perfumes.has(a.perfumeId)))
    return { ok: false, error: 'Un ajuste apunta a un perfume que no existe.' }
  return { ok: true, respaldo: json as unknown as Respaldo }
}

export async function construirRespaldo(): Promise<Respaldo> {
  const [perfumes, clientes, ventas, pagos, ajustes, config] = await Promise.all([
    db.perfumes.toArray(),
    db.clientes.toArray(),
    db.ventas.toArray(),
    db.pagos.toArray(),
    db.ajustes.toArray(),
    db.config.toArray(),
  ])
  return {
    version: VERSION_RESPALDO,
    exportadoEn: new Date().toISOString(),
    perfumes,
    clientes,
    ventas,
    pagos,
    ajustes,
    config: config.filter((c) => c.clave !== 'ultimoRespaldo'),
  }
}

export function nombreArchivoRespaldo(fecha: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `decants-respaldo-${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}.json`
}

export async function exportarRespaldo(): Promise<void> {
  const respaldo = await construirRespaldo()
  const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivoRespaldo()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  await db.config.put({ clave: 'ultimoRespaldo', valor: respaldo.exportadoEn })
}

/** Reemplaza TODOS los datos por los del respaldo (ya validado), en una sola transacción. */
export async function restaurarRespaldo(r: Respaldo): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    const ultimo = await db.config.get('ultimoRespaldo')
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.perfumes.bulkAdd(r.perfumes)
    await db.clientes.bulkAdd(r.clientes)
    await db.ventas.bulkAdd(r.ventas)
    await db.pagos.bulkAdd(r.pagos)
    await db.ajustes.bulkAdd(r.ajustes)
    await db.config.bulkAdd(r.config.filter((c) => c.clave !== 'ultimoRespaldo'))
    // Los datos coinciden con ese archivo, así que cuenta como respaldo reciente
    await db.config.put(ultimo ?? { clave: 'ultimoRespaldo', valor: r.exportadoEn })
  })
}
