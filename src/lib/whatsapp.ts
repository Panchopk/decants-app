import { formatoMonto } from './formato'

/** Enlace wa.me con el recordatorio de deuda. Devuelve null si no hay un teléfono válido. */
export function enlaceWhatsApp(
  telefono: string | undefined,
  nombre: string,
  deuda: number,
): string | null {
  const numero = (telefono ?? '').replace(/\D/g, '')
  if (numero.length < 7) return null
  const texto = `Hola ${nombre}, te recuerdo que tienes un saldo pendiente de ${formatoMonto(deuda)}. ¡Gracias!`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}
