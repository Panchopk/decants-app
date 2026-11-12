import { useLiveQuery } from 'dexie-react-hooks'
import { UMBRAL_STOCK_BAJO_DEFECTO } from '../lib/calculos'
import { db } from './db'

export function useUmbralStockBajo(): number {
  const fila = useLiveQuery(() => db.config.get('umbralStockBajo'))
  return typeof fila?.valor === 'number' ? fila.valor : UMBRAL_STOCK_BAJO_DEFECTO
}
