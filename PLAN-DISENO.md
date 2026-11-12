# Plan de mejoras de interacción y control de uso por perfume

Base: la app ya funciona (ver `PLAN.md`, fases 0 a 6).

**Decisión del dueño:** se conserva el estilo visual de siempre (índigo y gris azulado, tipografía del sistema). El rediseño "cálido y de lujo" se probó y se descartó. Lo que sí se quiere es: un **selector de tema claro/oscuro** y **mejoras en la interacción**.

Los pasos 2 a 5 solo cambiaron la interfaz. El **Paso 6** agrega una función nueva (decants vendidos y uso personal por perfume) y es el único que toca la lógica, con pruebas.

## Cómo ejecutarlo

Abrir una sesión en la carpeta `decants-app` con el modelo Sonnet y pedir:

> Lee PLAN-DISENO.md y ejecuta el Paso N. Al terminar, verifica el criterio "Listo cuando", haz commit y espera mi confirmación antes de pasar al siguiente paso.

Repetir paso por paso. Probar cada paso en el celular antes de seguir.

## Estado

| Paso | Qué | Estado |
|---|---|---|
| 0 | Contexto del producto (`PRODUCT.md`) | Hecho |
| 1 | Selector de tema claro / oscuro / automático, con el estilo actual | Hecho |
| 2 | Navegación con íconos y zona del pulgar | Hecho |
| 3 | "Nueva venta" en menos de 20 segundos | Hecho |
| 4 | Jerarquía y claridad en Inicio, Clientes y detalle | Hecho |
| 5 | Retroalimentación, estados vacíos y movimiento | Hecho |
| 6 | Decants vendidos por perfume y uso personal | Pendiente |

Cambios pedidos por el dueño durante la ejecución (ya hechos):
- Se quitó el aviso de "más de 7 días sin exportar un respaldo".
- El botón para cambiar de tema claro/oscuro está siempre a la vista (arriba a la derecha, en todas las pantallas). El selector con la opción Automático sigue en Ajustes.

## Colores: usar siempre los tokens

Los colores viven en `src/index.css` como variables con versión clara y oscura (por ejemplo `bg-surface`, `text-muted`, `bg-primary`, `text-debt`, `border-line-strong`). **Todo componente nuevo debe usar esos tokens, nunca clases como `bg-white`, `text-slate-500` o `bg-indigo-600`**, o se verá mal en el tema oscuro. El tema claro mantiene exactamente los colores de siempre. Si hace falta un color nuevo, agregar el token con sus dos versiones y revisar contraste AA en ambos temas.

## Movimiento: reglas ya establecidas (Paso 5)

- Curvas en `src/index.css`: `--ease-fuerte` (entradas) y `--ease-panel` (panel inferior). No inventar otras.
- Los estilos globales de transición de botones y enlaces van dentro de `@layer base`, para que las clases de cada componente (como `duration-200`) puedan sobrescribirlos.
- Todo movimiento con versión `prefers-reduced-motion` (sin desplazamiento; a lo sumo opacidad).
- Avisos: `useAvisos()` desde `src/components/Avisos.tsx`; estados vacíos: `src/components/EstadoVacio.tsx`; confirmaciones: `useConfirmar()` desde `src/components/PanelConfirmar.tsx` (nunca `confirm()`).

## Skills que Sonnet debe activar

Invocar con la herramienta Skill **antes de escribir código** de cada paso:

| Skill | Para qué |
|---|---|
| `anthropic-skills:impeccable` | Skill principal de diseño. Comandos para el Paso 6: `layout`, `clarify` y `harden`; `polish` al cerrar. Debe respetar el estilo actual: no proponer cambios de paleta ni de tipografía. |
| `anthropic-skills:mobile-native` | Detalles que hacen que una web se sienta nativa en el celular: zonas seguras, toques, zoom de inputs, altura de pantalla. |

En el Paso 6, además de impeccable, escribir primero las pruebas de la lógica nueva (Vitest) y después la pantalla.

Regla de impeccable: al terminar cada paso, correr el detector sobre los archivos cambiados: `<carpeta-de-la-skill>/scripts/impeccable.cmd detect --json src`. Debe dar `[]`.

## Pasos 1 a 5 (hechos, resumen)

- **Paso 1:** selector de tema (Automático / Claro / Oscuro) en Ajustes; la preferencia se guarda en el celular (`localStorage`, clave `tema`); lógica en `src/lib/tema.ts`.
- **Paso 2:** íconos SVG propios en la barra inferior, todos los objetivos tocables de al menos 44 px, zonas seguras y ajustes de app nativa.
- **Paso 3:** Nueva venta con los tamaños de cada perfume a la vista, barra fija con total y Guardar, pago rápido (Todo / Mitad / Otro monto). Vender 2 × 5 ml a un cliente existente toma 4 toques.
- **Paso 4:** una acción principal por cliente, historial agrupado por día, avatares con iniciales, panel inferior propio en lugar de `confirm()`.
- **Paso 5:** avisos breves al guardar, estados vacíos con invitación a la acción, fundido de pantalla de 150 ms, medidor de stock que se llena, panel inferior animado, todo con reducción de movimiento.

## Paso 6 (final): decants vendidos por perfume y uso personal

**Por qué:** el dueño a veces se echa del perfume para uso diario. Si sabe cuántos decants vendió de cada perfume, sabe cuántos ml salieron por ventas, y por diferencia cuántos ml usó él. Hoy la app solo muestra los ml restantes; no separa lo vendido de lo usado.

**Qué debe mostrar cada perfume (detalle y lista):**
- **Decants vendidos:** número total de unidades (suma de `cantidad` en ventas no anuladas) y su desglose por tamaño, por ejemplo "12 × 5 ml · 3 × 10 ml".
- **ml vendidos:** `ml × cantidad` de esas ventas.
- **Uso personal:** ml que el dueño sacó para sí. Se registra de dos formas:
  - **"Registrar uso personal"**: botón rápido que pide los ml y crea un ajuste de stock negativo con tipo "uso personal".
  - **"Contar la botella"**: el dueño mide cuánto queda realmente; la app compara con lo que esperaba (iniciales − vendidos + ajustes) y propone registrar la diferencia como uso personal, con un panel de confirmación que muestra la cuenta.
- Un resumen de una línea en cada tarjeta de la lista de perfumes: "12 decants vendidos · 4 ml de uso personal".

**Cambio de datos permitido:** agregar un campo **opcional** `tipo?: 'uso_personal' | 'merma' | 'correccion'` a `AjusteStock` en `src/db/tipos.ts`.
- **No** cambiar los índices de Dexie ni subir la versión de la base: un campo opcional nuevo no lo requiere, y así los datos que ya existen en el celular del amigo siguen funcionando.
- Los ajustes antiguos, sin `tipo`, se tratan como "otro" y siguen restando stock igual que hoy.
- Actualizar el validador de `src/lib/respaldo.ts` para aceptar `tipo` opcional (y rechazar valores desconocidos), y agregar una prueba de que un respaldo viejo sin `tipo` sigue importándose.

**Lógica (funciones puras en `src/lib/calculos.ts`, con pruebas en Vitest):**
- `decantsVendidos(perfumeId, ventas)` → `{ unidades, mlVendidos, porTamano: { ml, cantidad }[] }`, ignorando ventas anuladas.
- `usoPersonal(perfumeId, ajustes)` → ml sumados de los ajustes de tipo `uso_personal` (en positivo).
- `diferenciaConteo(esperado, real)` → ml a registrar al contar la botella.
- Pruebas: ventas anuladas, varios tamaños, cantidades mayores a 1, perfumes distintos, ajustes sin tipo, conteo que coincide, conteo menor y conteo mayor (en ese caso ofrecer "corrección", no uso personal).
- `mlRestantes` **no cambia**: el uso personal es un ajuste negativo más, así el stock sigue cuadrando.

**Diseño:** una sección "Ventas y uso" en el detalle del perfume, con los números grandes; usar `layout` y `clarify` de impeccable para que se entienda de un vistazo. El panel de "Contar la botella" usa `useConfirmar()` o un panel inferior igual, no `confirm()`. Los guardados muestran un aviso con `useAvisos()`.

- Comandos: `layout`, `clarify`, `harden`. Skill de apoyo: `mobile-native`.
- **Listo cuando:** con un perfume de 100 ml, vender 3 × 5 ml y 2 × 10 ml muestra "5 decants vendidos" (35 ml) con el desglose; registrar 8 ml de uso personal muestra "Uso personal: 8 ml" y 57 ml restantes; contar la botella con 55 ml reales propone registrar 2 ml más; un respaldo exportado antes de este paso se importa sin errores; `npm test` pasa con las pruebas nuevas.

## Reglas para todos los pasos

1. No cambiar el esquema de Dexie ni los datos guardados (única excepción: el campo opcional `tipo` del Paso 6).
2. Todo el texto de la interfaz en español, con voz **neutra: sin dirigirse al usuario** (decisión del dueño, registrada en `PRODUCT.md`): "Crear perfume", no "Crea tu perfume". Una excepción: el mensaje de WhatsApp que el dueño envía a sus clientes sí les habla directamente.
3. Mantener la CSP del build: sin fuentes ni scripts externos.
4. Usar los tokens de color y revisar cada pantalla nueva en tema claro y oscuro.
5. Al terminar cada paso: `npm test`, `npm run build`, detector de impeccable, commit, y esperar confirmación.
6. Los commits usan el correo noreply ya configurado en este repositorio; no cambiar `git config`.
7. Para publicar, solo subir a `main` cuando el dueño lo pida: eso actualiza la app que usa su amigo.
8. Al editar archivos con acentos desde PowerShell, usar `-Encoding UTF8` al leer y al escribir, o mejor las herramientas Edit/Write (una actualización anterior dañó los acentos de este archivo).
