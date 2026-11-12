# Plan de diseño: 5 mejoras de interfaz y estilo visual, y control de uso por perfume

Base: la app ya funciona (ver `PLAN.md`, fases 0 a 6). Los pasos 1 a 5 **solo cambian la interfaz**: no tocan el esquema de datos (`src/db`), ni la lógica (`src/lib/calculos.ts`, `respaldo.ts`), ni la CSP, ni el modo sin conexión. El **Paso 6** agrega una función nueva (decants vendidos y uso personal por perfume) y es el único que toca la lógica, con pruebas.

## Cómo ejecutarlo

Abrir una sesión en la carpeta `decants-app` con el modelo Sonnet y pedir:

> Lee PLAN-DISENO.md y ejecuta el Paso 0 y el Paso 1. Al terminar, verifica el criterio "Listo cuando", haz commit y espera mi confirmación antes de pasar al siguiente paso.

Repetir paso por paso. Probar cada paso en el celular antes de seguir.

## Skills que Sonnet debe activar

Invocar con la herramienta Skill **antes de escribir código** de cada paso:

| Skill | Para qué |
|---|---|
| `anthropic-skills:impeccable` | Skill principal de diseño. Usar sus comandos `typeset`, `colorize`, `layout`, `adapt`, `clarify`, `harden`, `onboard`, `animate`, `delight`, `polish` (uno por paso, ver abajo). |
| `anthropic-skills:mobile-native` | Detalles que hacen que una web se sienta nativa en el celular: zonas seguras, toques, zoom de inputs, altura de pantalla. Úsala en los pasos 2 y 3. |
| `anthropic-skills:ui-ux-pro-max` | Apoyo para paletas, pares de tipografías y pautas de UX. Úsala en el Paso 1. |
| `anthropic-skills:animate` | Solo en el Paso 5, para el movimiento. |

En el Paso 6, además de impeccable, escribir primero las pruebas de la lógica nueva (Vitest) y después la pantalla.

Regla de impeccable: al terminar cada paso, correr el detector sobre los archivos cambiados:
`<carpeta-de-la-skill>/scripts/impeccable.cmd detect --json src`. Debe dar `[]`.

## Diagnóstico (resumen)

La app es clara y rápida de entender, pero **se ve como cualquier app hecha con Tailwind**: tarjetas blancas sobre gris, índigo genérico, texto del sistema. Nada dice "perfumes". Además hay botones de texto muy pequeños (Anular, Eliminar), navegación solo con texto, y la pantalla de venta es un formulario largo con el botón Guardar al final.

## Paso 0: contexto (opcional, 2 minutos)

Ejecutar `/impeccable init` para crear `PRODUCT.md` con: usuario único (vendedor de decants), uso en celular con una mano, español, tono. Así las decisiones siguientes quedan documentadas.

## Paso 1: identidad visual propia (color y tipografía)

- Definir una paleta con carácter de perfumería en `src/index.css` usando `@theme` de Tailwind (tokens, no colores sueltos), siguiendo la dirección elegida abajo ("Decisión del dueño"). Cada token de color debe tener versión clara y oscura desde el principio.
- Elegir un par de tipografías (una con personalidad para títulos y montos, otra legible para texto) cargadas **desde archivos propios** en `public/` (la CSP del build solo permite `'self'`; no usar Google Fonts).
- Números con cifras tabulares en todos los montos y ml.
- Reemplazar `indigo-*`, `slate-*` y los colores de deuda/saldo por los tokens nuevos. Mantener contraste AA.
- Actualizar `theme-color`, íconos de la PWA y `favicon.svg` a la nueva paleta.
- Comandos: `typeset`, `colorize`.
- **Listo cuando:** ninguna clase `indigo-*` queda en `src/`; los títulos y montos usan la nueva tipografía; contraste AA; `npm run build` y `npm test` pasan.

## Paso 2: navegación con íconos y zona del pulgar

- Íconos SVG propios (en línea, sin librerías externas) junto a cada etiqueta de la barra inferior, con estado activo claro.
- Botón central "+" más integrado a la barra (no flotando de forma genérica), con etiqueta accesible.
- Todos los elementos tocables miden al menos 44 × 44 px; revisar Anular, Eliminar, Cambiar, Quitar tamaño.
- Zonas seguras (`env(safe-area-inset-*)`) y sin destello al tocar.
- Comandos: `layout`, `adapt`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** ningún objetivo tocable mide menos de 44 px (comprobar con el navegador a 375 px de ancho).

## Paso 3: "Nueva venta" en menos de 20 segundos

- Barra fija abajo con el **total** y el botón **Guardar venta**, siempre visible mientras se arma la venta.
- Elegir perfume con tarjetas o fichas tocables (nombre + ml restantes) en lugar del `<select>` nativo.
- Cantidad con botones grandes; precio editable plegado ("Cambiar precio") para no recargar la vista.
- "Pagó ahora" como interruptor grande con opciones rápidas: Todo / Mitad / Otro monto.
- Comandos: `shape` (para planear el flujo antes de codificar), `layout`.
- **Listo cuando:** vender 2 × 5 ml a un cliente existente se hace en 4 toques o menos, sin desplazar la pantalla para ver Guardar.

## Paso 4: jerarquía y claridad en Inicio, Clientes y detalle

- Estado del cliente como etiqueta (Debe / Al día / A favor) con texto y color, junto a un avatar con iniciales.
- En el detalle: si debe y tiene teléfono, **"Recordar por WhatsApp" es la acción principal**; Registrar pago y Editar pasan a secundarias. Hoy hay tres botones de colores compitiendo.
- Historial agrupado por fecha, con monto con signo y color; acciones de Anular y Eliminar dentro de un menú o panel, no como texto suelto.
- Reemplazar `confirm()` del navegador por un **panel inferior propio** con texto claro de lo que pasará.
- Comandos: `clarify`, `harden`, `layout`.
- **Listo cuando:** no queda ningún `confirm(` en `src/`; las 3 acciones del detalle tienen jerarquía visible; Anular y Eliminar piden confirmación en el panel propio.

## Paso 5: retroalimentación, estados vacíos y movimiento

- Avisos breves ("Venta guardada", "Pago registrado", "Respaldo descargado") que se desvanecen solos.
- Estados vacíos con una invitación a la acción (por ejemplo, "Crea tu primer perfume") en Inicio, Clientes y Perfumes.
- Movimiento sutil: barras de stock que se llenan, transición entre pantallas, respuesta al tocar. Respetar `prefers-reduced-motion`.
- Modo oscuro con los mismos tokens, siguiendo el tema del celular (`prefers-color-scheme`). Comprobar contraste AA también en oscuro y actualizar `theme-color` para ambos temas.
- Comandos: `onboard`, `animate`, `delight`, y al final `polish`. Skill de apoyo: `animate`.
- **Listo cuando:** cada acción que guarda algo muestra confirmación; un celular sin datos muestra invitaciones en vez de pantallas vacías; con "reducir movimiento" activado no hay animaciones.

## Paso 6 (final): decants vendidos por perfume y uso personal

**Por qué:** el dueño a veces se echa del perfume para uso diario. Si sabe cuántos decants vendió de cada perfume, sabe cuántos ml salieron por ventas, y por diferencia cuántos ml usó él. Hoy la app solo muestra los ml restantes; no separa lo vendido de lo usado.

**Qué debe mostrar cada perfume (detalle y lista):**
- **Decants vendidos:** número total de unidades (suma de `cantidad` en ventas no anuladas) y su desglose por tamaño, por ejemplo "12 × 5 ml · 3 × 10 ml".
- **ml vendidos:** `ml × cantidad` de esas ventas.
- **Uso personal:** ml que el dueño sacó para sí. Se registra de dos formas:
  - **"Registré uso personal"**: botón rápido que pide los ml y crea un ajuste de stock negativo con tipo "uso personal".
  - **"Contar la botella"**: el dueño mide cuánto queda realmente; la app compara con lo que esperaba (iniciales − vendidos + ajustes) y propone registrar la diferencia como uso personal, con un panel de confirmación que muestra la cuenta.
- Un resumen de una línea en cada tarjeta de la lista de perfumes: "12 decants vendidos · 4 ml de uso personal".

**Cambio de datos permitido (única excepción a la regla 1):** agregar un campo **opcional** `tipo?: 'uso_personal' | 'merma' | 'correccion'` a `AjusteStock` en `src/db/tipos.ts`.
- **No** cambiar los índices de Dexie ni subir la versión de la base: un campo opcional nuevo no lo requiere, y así los datos que ya existen en el celular del amigo siguen funcionando.
- Los ajustes antiguos, sin `tipo`, se tratan como "otro" y siguen restando stock igual que hoy.
- Actualizar el validador de `src/lib/respaldo.ts` para aceptar `tipo` opcional (y rechazar valores desconocidos), y agregar una prueba de que un respaldo viejo sin `tipo` sigue importándose.

**Lógica (funciones puras en `src/lib/calculos.ts`, con pruebas en Vitest):**
- `decantsVendidos(perfumeId, ventas)` → `{ unidades, mlVendidos, porTamano: { ml, cantidad }[] }`, ignorando ventas anuladas.
- `usoPersonal(perfumeId, ajustes)` → ml sumados de los ajustes de tipo `uso_personal` (en positivo).
- `diferenciaConteo(esperado, real)` → ml a registrar al contar la botella.
- Pruebas: ventas anuladas, varios tamaños, cantidades mayores a 1, perfumes distintos, ajustes sin tipo, conteo que coincide, conteo menor y conteo mayor (en ese caso ofrecer "corrección", no uso personal).
- `mlRestantes` **no cambia**: el uso personal es un ajuste negativo más, así el stock sigue cuadrando.

**Diseño:** una pequeña sección "Ventas y uso" en el detalle del perfume, con los números grandes en la tipografía de montos; usar `layout` y `clarify` de impeccable para que se entienda de un vistazo. El panel de "Contar la botella" usa el mismo panel inferior del Paso 4, no `confirm()`.

- Comandos: `layout`, `clarify`, `harden`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** con un perfume de 100 ml, vender 3 × 5 ml y 2 × 10 ml muestra "5 decants vendidos" (35 ml) con el desglose; registrar 8 ml de uso personal muestra "Uso personal: 8 ml" y 57 ml restantes; contar la botella con 55 ml reales propone registrar 2 ml más; un respaldo exportado antes de este paso se importa sin errores; `npm test` pasa con las pruebas nuevas.

## Reglas para todos los pasos

1. No cambiar el esquema de Dexie ni los datos guardados (única excepción: el campo opcional `tipo` del Paso 6).
2. Todo el texto de la interfaz en español.
3. Mantener la CSP del build: sin fuentes ni scripts externos.
4. Al terminar cada paso: `npm test`, `npm run build`, detector de impeccable, commit, y esperar confirmación.
5. Los commits usan el correo noreply ya configurado en este repositorio; no cambiar `git config`.
6. Para publicar, solo subir a `main` cuando el dueño lo pida: eso actualiza la app que usa su amigo.

## Decisión del dueño

Opciones que se ofrecieron: A) cálida y de lujo, B) fresca y limpia (crema con verde salvia), C) conservar el índigo pulido. Respuesta:

- **Elegida: A) cálida y de lujo.** Tinta oscura, dorado y crema; títulos y montos con una tipografía serif elegante; texto en una sans legible. Evitar el negro puro y el dorado chillón: usar un dorado apagado (tipo latón) y una tinta con un leve tono cálido.
- **Modo oscuro: sí, incluirlo en el Paso 5.** Las decisiones de color del Paso 1 deben definirse como tokens que tengan versión clara y oscura desde el inicio, para no rehacerlas después.
