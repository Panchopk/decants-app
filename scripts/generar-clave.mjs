// Elige la clave de acceso de la app SIN escribirla en ningún archivo ni en el chat.
// Uso:  npm run clave
// Guarda solo un hash (PBKDF2-SHA256, 600.000 vueltas) en .env.local (ignorado por git)
// y, si se acepta, en el secreto CLAVE_HASH de GitHub para la app publicada.
import { spawnSync } from 'node:child_process'
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ITERACIONES = 600_000
const MINIMO = 10

if (!process.stdin.isTTY) {
  console.error('Ejecutar este script en una terminal interactiva (npm run clave).')
  process.exit(1)
}

/** Lee una línea sin mostrar lo que se escribe. */
function pedirOculto(texto) {
  return new Promise((resolver) => {
    process.stdout.write(texto)
    let valor = ''
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    const alTeclear = (c) => {
      for (const ch of c) {
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.off('data', alTeclear)
          process.stdout.write('\n')
          return resolver(valor)
        }
        if (ch === '\u0003') process.exit(130) // Ctrl+C
        if (ch === '\u007f' || ch === '\b') valor = valor.slice(0, -1)
        else valor += ch
      }
    }
    process.stdin.on('data', alTeclear)
  })
}

function pedirTexto(texto) {
  return new Promise((resolver) => {
    process.stdout.write(texto)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()
    process.stdin.once('data', (d) => {
      process.stdin.pause()
      resolver(String(d).trim())
    })
  })
}

console.log('Elegir la clave de acceso de Decants.')
console.log(`Debe tener al menos ${MINIMO} caracteres. Conviene una frase larga que no se use en otro sitio.\n`)

const clave = await pedirOculto('Clave: ')
if (clave.length < MINIMO) {
  console.error(`\nDemasiado corta (mínimo ${MINIMO} caracteres). No se guardó nada.`)
  process.exit(1)
}
const repetida = await pedirOculto('Repetir la clave: ')
if (repetida !== clave) {
  console.error('\nLas claves no coinciden. No se guardó nada.')
  process.exit(1)
}

const sal = randomBytes(16)
const hash = pbkdf2Sync(clave, sal, ITERACIONES, 32, 'sha256')
const valor = `pbkdf2-sha256$${ITERACIONES}$${sal.toString('base64')}$${hash.toString('base64')}`

// 1) Para probar en este equipo (npm run dev / npm run build)
const archivo = '.env.local'
const lineas = existsSync(archivo)
  ? readFileSync(archivo, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('VITE_CLAVE_HASH='))
  : []
lineas.push(`VITE_CLAVE_HASH=${valor}`)
writeFileSync(archivo, lineas.join('\n') + '\n')
console.log(`\nListo: el hash quedó en ${archivo} (no se sube a git).`)

// 2) Para la app publicada
const subir = (await pedirTexto('\n¿Guardarlo también en GitHub para la app publicada? (s/n): ')).toLowerCase()
if (subir === 's' || subir === 'si' || subir === 'sí') {
  const r = spawnSync('gh', ['secret', 'set', 'CLAVE_HASH'], {
    input: valor,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  if (r.status === 0) {
    console.log('Secreto CLAVE_HASH guardado en GitHub.')
    console.log('Falta publicar de nuevo para que rija en la app publicada:  gh workflow run "Publicar en GitHub Pages"')
  } else {
    console.error('No se pudo guardar en GitHub:', (r.stderr || r.error?.message || '').trim())
    console.error('Se puede hacer a mano:  gh secret set CLAVE_HASH   (y pegar el hash de .env.local)')
  }
} else {
  console.log('No se subió a GitHub: la app publicada seguirá abierta hasta que se guarde el secreto CLAVE_HASH.')
}
console.log('\nAl cambiar la clave, cada dispositivo la vuelve a pedir una vez.')
