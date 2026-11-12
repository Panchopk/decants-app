# Plan de mejoras de interacción y control de uso por perfume

Base: la app ya funciona (ver `PLAN.md`, fases 0 a 6).

**Decisión del dueño:** se conserva el estilo visual de siempre (índigo y gris azulado, tipografía del sistema). El rediseño "cálido y de lujo" se probó y se descartó. Lo que sí se quiere es: un **selector de tema claro/oscuro** y **mejoras en la interacción**.

Los pasos 2 a 5 **solo cambian la interfaz**: no tocan el esquema de datos (`src/db`), ni la lógica (`src/lib/calculos.ts`, `respaldo.ts`), ni la CSP, ni el modo sin conexión. El **Paso 6** agrega una función nueva (decants vendidos y uso personal por perfume) y es el único que toca la lógica, con pruebas.

## Cómo ejecutarlo

Abrir una sesión en la carpeta `decants-app` con el modelo Sonnet y pedir:

> Lee PLAN-DISENO.md y ejecuta el Paso N. Al terminar, verifica el criterio "Listo cuando", haz commit y espera mi confirmación antes de pasar al siguiente paso.

Repetir paso por paso. Probar cada paso en el celular antes de seguir.

## Estado

| Paso | Qué | Estado |
|---|---|---|
| 0 | Contexto del producto (`PRODUCT.md`) | Hecho |
| 1 | Selector de tema claro / oscuro / automático, con el estilo actual | Hecho |
| 2 | Navegación con íconos y zona del pulgar | Pendiente |
| 3 | "Nueva venta" en menos de 20 segundos | Pendiente |
| 4 | Jerarquía y claridad en Inicio, Clientes y detalle | Pendiente |
| 5 | Retroalimentación, estados vacíos y movimiento | Pendiente |
| 6 | Decants vendidos por perfume y uso personal | Pendiente |

## Colores: usar siempre los tokens

Los colores viven en `src/index.css` como variables con versión clara y oscura (por ejemplo `bg-surface`, `text-muted`, `bg-primary`, `text-debt`, `border-line-strong`). **Todo componente nuevo debe usar esos tokens, nunca clases como `bg-white`, `text-slate-500` o `bg-indigo-600`**, o se verá mal en el tema oscuro. El tema claro mantiene exactamente los colores de siempre. Si hace falta un color nuevo, agregar el token con sus dos versiones y revisar contraste AA en ambos temas.

## Skills que Sonnet debe activar

Invocar con la herramienta Skill **antes de escribir código** de cada paso:

| Skill | Para qué |
|---|---|
| `anthropic-skills:impeccable` | Skill principal de diseño. Comandos por paso: `layout` y `adapt` (2, 3), `clarify`, `harden` y `layout` (4), `onboard`, `animate` y `delight` (5), `polish` al cerrar cada paso. Debe respetar el estilo actual: no proponer cambios de paleta ni de tipografía. |
| `anthropic-skills:mobile-native` | Detalles que hacen que una web se sienta nativa en el celular: zonas seguras, toques, zoom de inputs, altura de pantalla. Úsala en los pasos 2 y 3. |
| `anthropic-skills:animate` | Solo en el Paso 5, para el movimiento. |

En el Paso 6, además de impeccable, escribir primero las pruebas de la lógica nueva (Vitest) y después la pantalla.

Regla de impeccable: al terminar cada paso, correr el detector sobre los archivos cambiados: `<carpeta-de-la-skill>/scripts/impeccable.cmd detect --json src`. Debe dar `[]`.

## Diagnóstico (resumen)

La app es clara y rápida de entender. Lo que estorba al usarla: botones de texto muy pequeños (Anular, Eliminar), navegación solo con texto, una pantalla de venta que es un formulario largo con el botón Guardar al final, avisos del navegador (`confirm()`) que se ven ajenos, y ninguna confirmación al guardar.

## Paso 1 (hecho): tema claro / oscuro

Selector "Apariencia" en Ajustes con Automático, Claro y Oscuro. Automático sigue el tema del celular. La preferencia se guarda en el celular (`localStorage`, clave `tema`) y se aplica al abrir la app. El color de la barra del sistema (`theme-color`) cambia con el tema. La lógica está en `src/lib/tema.ts`.

## Paso 2: navegación con íconos y zona del pulgar

- Íconos SVG propios (en línea, sin librerías externas) junto a cada etiqueta de la barra inferior, con estado activo claro.
- Botón central "+" mejor integrado a la barra, con etiqueta accesible.
- Todos los elementos tocables miden al menos 44 × 44 px; revisar Anular, Eliminar, Cambiar, Quitar tamaño.
- Zonas seguras (`env(safe-area-inset-*)`) y sin destello al tocar.
- Comandos: `layout`, `adapt`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** ningún objetivo tocable mide menos de 44 px (comprobar con el navegador a 375 px de ancho, en ambos temas).

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
- Comandos: `onboard`, `animate`, `delight`, y al final `polish`. Skill de apoyo: `animate`.
- **Listo cuando:** cada acción que guarda algo muestra confirmación; una app sin datos muestra invitaciones en vez de pantallas vacías; con "reducir movimiento" activado no hay animaciones.

## Paso 6 (final): decants vendidos por perfume y uso personal

**Por qué:** el dueño a veces se echa del perfume para uso diario. Si sabe cuántos decants vendió de cada perfume, sabe cuántos ml salieron por ventas, y por diferencia cuántos ml usó él. Hoy la app solo muestra los ml restantes; no separa lo vendido de lo usado.

**Qué debe mostrar cada perfume (detalle y lista):**
- **Decants vendidos:** número total de unidades (suma de `cantidad` en ventas no anuladas) y su desglose por tamaño, por ejemplo "12 × 5 ml · 3 × 10 ml".
- **ml vendidos:** `ml × cantidad` de esas ventas.
- **Uso personal:** ml que el dueño sacó para sí. Se registra de dos formas:
  - **"Registré uso personal"**: botón rápido que pide los ml y crea un ajuste de stock negativo con tipo "uso personal".
  - **"Contar la botella"**: el dueño mide cuánto queda realmente; la app compara con lo que esperaba (iniciales − vendidos + ajustes) y propone registrar la diferencia como uso personal, con un panel de confirmación que muestra la cuenta.
- Un resumen de una línea en cada tarjeta de la lista de perfumes: "12 decants vendidos · 4 ml de uso personal".

**Cambio de datos permitido (única excepción a "no tocar `src/db`"):** agregar un campo **opcional** `tipo?: 'uso_personal' | 'merma' | 'correccion'` a `AjusteStock` en `src/db/tipos.ts`.
- **No** cambiar los índices de Dexie ni subir la versión de la base: un campo opcional nuevo no lo requiere, y así los datos que ya existen en el celular del amigo siguen funcionando.
- Los ajustes antiguos, sin `tipo`, se tratan como "otro" y siguen restando stock igual que hoy.
- Actualizar el validador de `src/lib/respaldo.ts` para aceptar `tipo` opcional (y rechazar valores desconocidos), y agregar una prueba de que un respaldo viejo sin `tipo` sigue importándose.

**Lógica (funciones puras en `src/lib/calculos.ts`, con pruebas en Vitest):**
- `decantsVendidos(perfumeId, ventas)` → `{ unidades, mlVendidos, porTamano: { ml, cantidad }[] }`, ignorando ventas anuladas.
- `usoPersonal(perfumeId, ajustes)` → ml sumados de los ajustes de tipo `uso_personal` (en positivo).
- `diferenciaConteo(esperado, real)` → ml a registrar al contar la botella.
- Pruebas: ventas anuladas, varios tamaños, cantidades mayores a 1, perfumes distintos, ajustes sin tipo, conteo que coincide, conteo menor y conteo mayor (en ese caso ofrecer "corrección", no uso personal).
- `mlRestantes` **no cambia**: el uso personal es un ajuste negativo más, así el stock sigue cuadrando.

**Diseño:** una sección "Ventas y uso" en el detalle del perfume, con los números grandes; usar `layout` y `clarify` de impeccable para que se entienda de un vistazo. El panel de "Contar la botella" usa el mismo panel inferior del Paso 4, no `confirm()`.

- Comandos: `layout`, `clarify`, `harden`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** con un perfume de 100 ml, vender 3 × 5 ml y 2 × 10 ml muestra "5 decants vendidos" (35 ml) con el desglose; registrar 8 ml de uso personal muestra "Uso personal: 8 ml" y 57 ml restantes; contar la botella con 55 ml reales propone registrar 2 ml más; un respaldo exportado antes de este paso se importa sin errores; `npm test` pasa con las pruebas nuevas.

## Reglas para todos los pasos

1. No cambiar el esquema de Dexie ni los datos guardados (única excepción: el campo opcional `tipo` del Paso 6).
2. Todo el texto de la interfaz en español, con voz **neutra: sin dirigirse al usuario** (decisión del dueño, registrada en `PRODUCT.md`). Hoy quedan frases en "tú" ("Crea el primero", "Tus datos viven solo en este celular", "Exporta un respaldo seguido", "Aún no has exportado ninguno", "Agrega un teléfono...", "Quién te debe", "Nadie te debe nada"): reescribirlas a medida que se toque cada pantalla, y revisar que no quede ninguna al terminar el Paso 5.
3. Mantener la CSP del build: sin fuentes ni scripts externos.
4. Usar los tokens de color (ver arriba) y revisar cada pantalla nueva en tema claro y oscuro.
5. Al terminar cada paso: `npm test`, `npm run build`, detector de impeccable, commit, y esperar confirmación.
6. Los commits usan el correo noreply ya configurado en este repositorio; no cambiar `git config`.
7. Para publicar, solo subir a `main` cuando el dueño lo pida: eso actualiza la app que usa su amigo.
