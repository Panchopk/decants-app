/**
 * Clave de acceso: se pide una sola vez por dispositivo.
 *
 * - La clave nunca se guarda: solo un hash PBKDF2 (en `VITE_CLAVE_HASH`, definido al compilar).
 * - Sin `VITE_CLAVE_HASH` la app abre libremente (así no se bloquea nadie por error).
 * - Es una barrera de entrada: no cifra los datos guardados en el celular.
 */

export const ITERACIONES = 600_000
const PREFIJO = 'pbkdf2-sha256'
const LLAVE_ACCESO = 'acceso'
const LLAVE_FALLOS = 'acceso-fallos'
const MAX_FALLOS_LIBRES = 5

/** Hash configurado al compilar ('' = sin clave). */
export const HASH_CONFIGURADO: string = String(import.meta.env.VITE_CLAVE_HASH ?? '').trim()

export const accesoRequerido = (hash: string = HASH_CONFIGURADO) => hash !== ''

const aBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b))
const deBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function derivar(clave: string, sal: Uint8Array, iteraciones: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal as BufferSource, iterations: iteraciones },
    material,
    256,
  )
  return new Uint8Array(bits)
}

/** Formato: pbkdf2-sha256$<iteraciones>$<sal base64>$<hash base64> */
export async function crearHash(clave: string, iteraciones: number = ITERACIONES): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivar(clave, sal, iteraciones)
  return `${PREFIJO}$${iteraciones}$${aBase64(sal)}$${aBase64(hash)}`
}

/** Comparación sin cortar en la primera diferencia. */
function iguales(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a[i] ^ b[i]
  return diferencia === 0
}

export async function verificarClave(clave: string, hash: string = HASH_CONFIGURADO): Promise<boolean> {
  const partes = hash.split('$')
  if (partes.length !== 4 || partes[0] !== PREFIJO) return false
  const iteraciones = Number(partes[1])
  if (!Number.isInteger(iteraciones) || iteraciones < 1) return false
  try {
    const calculado = await derivar(clave, deBase64(partes[2]), iteraciones)
    return iguales(calculado, deBase64(partes[3]))
  } catch {
    return false
  }
}

/** Identifica la clave vigente: si se cambia la clave, los dispositivos vuelven a pedirla. */
export const huella = (hash: string = HASH_CONFIGURADO) => hash.split('$')[3]?.slice(0, 16) ?? ''

/** Segundos de espera tras `n` fallos seguidos: 0 hasta 5; luego 30 s, 60 s, 120 s... máximo 10 min. */
export function esperaTrasFallos(n: number): number {
  return n < MAX_FALLOS_LIBRES ? 0 : Math.min(600, 30 * 2 ** (n - MAX_FALLOS_LIBRES))
}

function leer(llave: string): string | null {
  try {
    return localStorage.getItem(llave)
  } catch {
    return null
  }
}
function guardar(llave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(llave)
    else localStorage.setItem(llave, valor)
  } catch {
    // Sin almacenamiento: la clave se pedirá de nuevo la próxima vez
  }
}

export const tieneAcceso = (hash: string = HASH_CONFIGURADO) => leer(LLAVE_ACCESO) === huella(hash)
export const concederAcceso = (hash: string = HASH_CONFIGURADO) => {
  guardar(LLAVE_ACCESO, huella(hash))
  guardar(LLAVE_FALLOS, null)
}

interface Fallos {
  n: number
  hasta: number
}
function leerFallos(): Fallos {
  try {
    const f = JSON.parse(leer(LLAVE_FALLOS) ?? '')
    if (typeof f?.n === 'number' && typeof f?.hasta === 'number') return f
  } catch {
    // sin datos
  }
  return { n: 0, hasta: 0 }
}

/** Segundos que faltan para poder intentar de nuevo (0 = ya se puede). */
export function segundosBloqueado(ahora: number = Date.now()): number {
  return Math.max(0, Math.ceil((leerFallos().hasta - ahora) / 1000))
}

export function registrarFallo(ahora: number = Date.now()): number {
  const n = leerFallos().n + 1
  const espera = esperaTrasFallos(n)
  guardar(LLAVE_FALLOS, JSON.stringify({ n, hasta: ahora + espera * 1000 }))
  return espera
}
