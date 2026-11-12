import Dexie, { type EntityTable } from 'dexie'
import type {
  AjusteStock,
  Cliente,
  Configuracion,
  Pago,
  Perfume,
  Venta,
} from './tipos'

export class DecantsDB extends Dexie {
  perfumes!: EntityTable<Perfume, 'id'>
  clientes!: EntityTable<Cliente, 'id'>
  ventas!: EntityTable<Venta, 'id'>
  pagos!: EntityTable<Pago, 'id'>
  ajustes!: EntityTable<AjusteStock, 'id'>
  config!: EntityTable<Configuracion, 'clave'>

  constructor(nombre = 'decants') {
    super(nombre)
    this.version(1).stores({
      perfumes: 'id, nombre, archivado',
      clientes: 'id, nombre',
      ventas: 'id, clienteId, fecha, anulada',
      pagos: 'id, clienteId, fecha',
      ajustes: 'id, perfumeId, fecha',
      config: 'clave',
    })
  }
}

export const db = new DecantsDB()
