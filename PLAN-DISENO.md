# Plan de mejoras de interacciÃ³n y control de uso por perfume

Base: la app ya funciona (ver `PLAN.md`, fases 0 a 6).

**DecisiÃ³n del dueÃ±o:** se conserva el estilo visual de siempre (Ã­ndigo y gris azulado, tipografÃ­a del sistema). El rediseÃ±o "cÃ¡lido y de lujo" se probÃ³ y se descartÃ³. Lo que sÃ­ se quiere es: un **selector de tema claro/oscuro** y **mejoras en la interacciÃ³n**.

Los pasos 2 a 5 **solo cambian la interfaz**: no tocan el esquema de datos (`src/db`), ni la lÃ³gica (`src/lib/calculos.ts`, `respaldo.ts`), ni la CSP, ni el modo sin conexiÃ³n. El **Paso 6** agrega una funciÃ³n nueva (decants vendidos y uso personal por perfume) y es el Ãºnico que toca la lÃ³gica, con pruebas.

## CÃ³mo ejecutarlo

Abrir una sesiÃ³n en la carpeta `decants-app` con el modelo Sonnet y pedir:

> Lee PLAN-DISENO.md y ejecuta el Paso N. Al terminar, verifica el criterio "Listo cuando", haz commit y espera mi confirmaciÃ³n antes de pasar al siguiente paso.

Repetir paso por paso. Probar cada paso en el celular antes de seguir.

## Estado

| Paso | QuÃ© | Estado |
|---|---|---|
| 0 | Contexto del producto (`PRODUCT.md`) | Hecho |
| 1 | Selector de tema claro / oscuro / automÃ¡tico, con el estilo actual | Hecho |
| 2 | NavegaciÃ³n con Ã­conos y zona del pulgar | Pendiente |
| 3 | "Nueva venta" en menos de 20 segundos | Pendiente |
| 4 | JerarquÃ­a y claridad en Inicio, Clientes y detalle | Pendiente |
| 5 | RetroalimentaciÃ³n, estados vacÃ­os y movimiento | Pendiente |
| 6 | Decants vendidos por perfume y uso personal | Pendiente |

## Colores: usar siempre los tokens

Los colores viven en `src/index.css` como variables con versiÃ³n clara y oscura (por ejemplo `bg-surface`, `text-muted`, `bg-primary`, `text-debt`, `border-line-strong`). **Todo componente nuevo debe usar esos tokens, nunca clases como `bg-white`, `text-slate-500` o `bg-indigo-600`**, o se verÃ¡ mal en el tema oscuro. El tema claro mantiene exactamente los colores de siempre. Si hace falta un color nuevo, agregar el token con sus dos versiones y revisar contraste AA en ambos temas.

## Skills que Sonnet debe activar

Invocar con la herramienta Skill **antes de escribir cÃ³digo** de cada paso:

| Skill | Para quÃ© |
|---|---|
| `anthropic-skills:impeccable` | Skill principal de diseÃ±o. Comandos por paso: `layout` y `adapt` (2, 3), `clarify`, `harden` y `layout` (4), `onboard`, `animate` y `delight` (5), `polish` al cerrar cada paso. Debe respetar el estilo actual: no proponer cambios de paleta ni de tipografÃ­a. |
| `anthropic-skills:mobile-native` | Detalles que hacen que una web se sienta nativa en el celular: zonas seguras, toques, zoom de inputs, altura de pantalla. Ãšsala en los pasos 2 y 3. |
| `anthropic-skills:animate` | Solo en el Paso 5, para el movimiento. |

En el Paso 6, ademÃ¡s de impeccable, escribir primero las pruebas de la lÃ³gica nueva (Vitest) y despuÃ©s la pantalla.

Regla de impeccable: al terminar cada paso, correr el detector sobre los archivos cambiados: `<carpeta-de-la-skill>/scripts/impeccable.cmd detect --json src`. Debe dar `[]`.

## DiagnÃ³stico (resumen)

La app es clara y rÃ¡pida de entender. Lo que estorba al usarla: botones de texto muy pequeÃ±os (Anular, Eliminar), navegaciÃ³n solo con texto, una pantalla de venta que es un formulario largo con el botÃ³n Guardar al final, avisos del navegador (`confirm()`) que se ven ajenos, y ninguna confirmaciÃ³n al guardar.

## Paso 1 (hecho): tema claro / oscuro

Selector "Apariencia" en Ajustes con AutomÃ¡tico, Claro y Oscuro. AutomÃ¡tico sigue el tema del celular. La preferencia se guarda en el celular (`localStorage`, clave `tema`) y se aplica al abrir la app. El color de la barra del sistema (`theme-color`) cambia con el tema. La lÃ³gica estÃ¡ en `src/lib/tema.ts`.

## Paso 2: navegaciÃ³n con Ã­conos y zona del pulgar

- Ãconos SVG propios (en lÃ­nea, sin librerÃ­as externas) junto a cada etiqueta de la barra inferior, con estado activo claro.
- BotÃ³n central "+" mejor integrado a la barra, con etiqueta accesible.
- Todos los elementos tocables miden al menos 44 Ã— 44 px; revisar Anular, Eliminar, Cambiar, Quitar tamaÃ±o.
- Zonas seguras (`env(safe-area-inset-*)`) y sin destello al tocar.
- Comandos: `layout`, `adapt`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** ningÃºn objetivo tocable mide menos de 44 px (comprobar con el navegador a 375 px de ancho, en ambos temas).

## Paso 3: "Nueva venta" en menos de 20 segundos

- Barra fija abajo con el **total** y el botÃ³n **Guardar venta**, siempre visible mientras se arma la venta.
- Elegir perfume con tarjetas o fichas tocables (nombre + ml restantes) en lugar del `<select>` nativo.
- Cantidad con botones grandes; precio editable plegado ("Cambiar precio") para no recargar la vista.
- "PagÃ³ ahora" como interruptor grande con opciones rÃ¡pidas: Todo / Mitad / Otro monto.
- Comandos: `shape` (para planear el flujo antes de codificar), `layout`.
- **Listo cuando:** vender 2 Ã— 5 ml a un cliente existente se hace en 4 toques o menos, sin desplazar la pantalla para ver Guardar.

## Paso 4: jerarquÃ­a y claridad en Inicio, Clientes y detalle

- Estado del cliente como etiqueta (Debe / Al dÃ­a / A favor) con texto y color, junto a un avatar con iniciales.
- En el detalle: si debe y tiene telÃ©fono, **"Recordar por WhatsApp" es la acciÃ³n principal**; Registrar pago y Editar pasan a secundarias. Hoy hay tres botones de colores compitiendo.
- Historial agrupado por fecha, con monto con signo y color; acciones de Anular y Eliminar dentro de un menÃº o panel, no como texto suelto.
- Reemplazar `confirm()` del navegador por un **panel inferior propio** con texto claro de lo que pasarÃ¡.
- Comandos: `clarify`, `harden`, `layout`.
- **Listo cuando:** no queda ningÃºn `confirm(` en `src/`; las 3 acciones del detalle tienen jerarquÃ­a visible; Anular y Eliminar piden confirmaciÃ³n en el panel propio.

## Paso 5: retroalimentaciÃ³n, estados vacÃ­os y movimiento

- Avisos breves ("Venta guardada", "Pago registrado", "Respaldo descargado") que se desvanecen solos.
- Estados vacÃ­os con una invitaciÃ³n a la acciÃ³n (por ejemplo, "Crea tu primer perfume") en Inicio, Clientes y Perfumes.
- Movimiento sutil: barras de stock que se llenan, transiciÃ³n entre pantallas, respuesta al tocar. Respetar `prefers-reduced-motion`.
- Comandos: `onboard`, `animate`, `delight`, y al final `polish`. Skill de apoyo: `animate`.
- **Listo cuando:** cada acciÃ³n que guarda algo muestra confirmaciÃ³n; una app sin datos muestra invitaciones en vez de pantallas vacÃ­as; con "reducir movimiento" activado no hay animaciones.

## Paso 6 (final): decants vendidos por perfume y uso personal

**Por quÃ©:** el dueÃ±o a veces se echa del perfume para uso diario. Si sabe cuÃ¡ntos decants vendiÃ³ de cada perfume, sabe cuÃ¡ntos ml salieron por ventas, y por diferencia cuÃ¡ntos ml usÃ³ Ã©l. Hoy la app solo muestra los ml restantes; no separa lo vendido de lo usado.

**QuÃ© debe mostrar cada perfume (detalle y lista):**
- **Decants vendidos:** nÃºmero total de unidades (suma de `cantidad` en ventas no anuladas) y su desglose por tamaÃ±o, por ejemplo "12 Ã— 5 ml Â· 3 Ã— 10 ml".
- **ml vendidos:** `ml Ã— cantidad` de esas ventas.
- **Uso personal:** ml que el dueÃ±o sacÃ³ para sÃ­. Se registra de dos formas:
  - **"RegistrÃ© uso personal"**: botÃ³n rÃ¡pido que pide los ml y crea un ajuste de stock negativo con tipo "uso personal".
  - **"Contar la botella"**: el dueÃ±o mide cuÃ¡nto queda realmente; la app compara con lo que esperaba (iniciales âˆ’ vendidos + ajustes) y propone registrar la diferencia como uso personal, con un panel de confirmaciÃ³n que muestra la cuenta.
- Un resumen de una lÃ­nea en cada tarjeta de la lista de perfumes: "12 decants vendidos Â· 4 ml de uso personal".

**Cambio de datos permitido (Ãºnica excepciÃ³n a "no tocar `src/db`"):** agregar un campo **opcional** `tipo?: 'uso_personal' | 'merma' | 'correccion'` a `AjusteStock` en `src/db/tipos.ts`.
- **No** cambiar los Ã­ndices de Dexie ni subir la versiÃ³n de la base: un campo opcional nuevo no lo requiere, y asÃ­ los datos que ya existen en el celular del amigo siguen funcionando.
- Los ajustes antiguos, sin `tipo`, se tratan como "otro" y siguen restando stock igual que hoy.
- Actualizar el validador de `src/lib/respaldo.ts` para aceptar `tipo` opcional (y rechazar valores desconocidos), y agregar una prueba de que un respaldo viejo sin `tipo` sigue importÃ¡ndose.

**LÃ³gica (funciones puras en `src/lib/calculos.ts`, con pruebas en Vitest):**
- `decantsVendidos(perfumeId, ventas)` â†’ `{ unidades, mlVendidos, porTamano: { ml, cantidad }[] }`, ignorando ventas anuladas.
- `usoPersonal(perfumeId, ajustes)` â†’ ml sumados de los ajustes de tipo `uso_personal` (en positivo).
- `diferenciaConteo(esperado, real)` â†’ ml a registrar al contar la botella.
- Pruebas: ventas anuladas, varios tamaÃ±os, cantidades mayores a 1, perfumes distintos, ajustes sin tipo, conteo que coincide, conteo menor y conteo mayor (en ese caso ofrecer "correcciÃ³n", no uso personal).
- `mlRestantes` **no cambia**: el uso personal es un ajuste negativo mÃ¡s, asÃ­ el stock sigue cuadrando.

**DiseÃ±o:** una secciÃ³n "Ventas y uso" en el detalle del perfume, con los nÃºmeros grandes; usar `layout` y `clarify` de impeccable para que se entienda de un vistazo. El panel de "Contar la botella" usa el mismo panel inferior del Paso 4, no `confirm()`.

- Comandos: `layout`, `clarify`, `harden`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** con un perfume de 100 ml, vender 3 Ã— 5 ml y 2 Ã— 10 ml muestra "5 decants vendidos" (35 ml) con el desglose; registrar 8 ml de uso personal muestra "Uso personal: 8 ml" y 57 ml restantes; contar la botella con 55 ml reales propone registrar 2 ml mÃ¡s; un respaldo exportado antes de este paso se importa sin errores; `npm test` pasa con las pruebas nuevas.

## Reglas para todos los pasos

1. No cambiar el esquema de Dexie ni los datos guardados (Ãºnica excepciÃ³n: el campo opcional `tipo` del Paso 6).
2. Todo el texto de la interfaz en espaÃ±ol, con voz **neutra: sin dirigirse al usuario** (decisiÃ³n del dueÃ±o, registrada en `PRODUCT.md`). Hoy quedan frases en "tÃº" ("Crea el primero", "Tus datos viven solo en este celular", "Exporta un respaldo seguido", "AÃºn no has exportado ninguno", "Agrega un telÃ©fono...", "QuiÃ©n te debe", "Nadie te debe nada"): reescribirlas a medida que se toque cada pantalla, y revisar que no quede ninguna al terminar el Paso 5.
3. Mantener la CSP del build: sin fuentes ni scripts externos.
4. Usar los tokens de color (ver arriba) y revisar cada pantalla nueva en tema claro y oscuro.
5. Al terminar cada paso: `npm test`, `npm run build`, detector de impeccable, commit, y esperar confirmaciÃ³n.
6. Los commits usan el correo noreply ya configurado en este repositorio; no cambiar `git config`.
7. Para publicar, solo subir a `main` cuando el dueÃ±o lo pida: eso actualiza la app que usa su amigo.

