export interface PrecioTamano {
  ml: number
  precio: number
}

export interface Perfume {
  id: string
  nombre: string
  marca?: string
  mlIniciales: number
  costoBotella?: number
  precios: PrecioTamano[]
  archivado: boolean
  creadoEn: string
}

export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  nota?: string
  creadoEn: string
}

export interface ItemVenta {
  perfumeId: string
  ml: number
  cantidad: number
  precioUnitario: number
}

export interface Venta {
  id: string
  clienteId: string
  fecha: string
  nota?: string
  items: ItemVenta[]
  total: number
  anulada: boolean
}

export type MetodoPago = 'efectivo' | 'transferencia' | 'otro'

export interface Pago {
  id: string
  clienteId: string
  monto: number
  fecha: string
  metodo?: MetodoPago
  nota?: string
}

export interface AjusteStock {
  id: string
  perfumeId: string
  /** negativo = merma/derrame, positivo = corrección */
  ml: number
  motivo: string
  fecha: string
}

export interface Configuracion {
  clave: string
  valor: string | number
}
