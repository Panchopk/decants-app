# Plan: app de control de decants (costo cero)

## 1. Problema que resuelve

El vendedor de decants de perfume olvida:

1. Quién le debe dinero y cuánto.
2. Quién ya pagó y quién no.
3. Cuántos ml le quedan a cada perfume.

La versión 1 resuelve solo esas tres cosas. Todo lo demás queda para después (sección 9).

## 2. Decisiones tomadas

| Tema | Decisión | Por qué |
|---|---|---|
| Tipo de app | PWA (web instalable en el celular) | Funciona en Android y iPhone, sin tiendas de apps ni cuentas de desarrollador pagadas |
| Datos | Guardados en el propio celular (IndexedDB) | Costo cero real, sin servidor, funciona sin internet |
| Respaldo | Exportar / importar un archivo JSON desde Ajustes | Si se pierde o cambia el celular, los datos no se pierden |
| Hosting | GitHub Pages (gratis) | Solo son archivos estáticos |
| Usuarios | Uno solo, sin login | Es una herramienta personal |

Riesgo conocido: los datos viven en un solo celular. Se mitiga con el respaldo y un aviso cuando pasen más de 7 días sin exportar. La sincronización en la nube queda como mejora futura.

## 3. Stack

- Vite + React + TypeScript
- Tailwind CSS
- Dexie (IndexedDB) + `dexie-react-hooks`
- React Router
- `vite-plugin-pwa` (instalable y offline)
- Vitest para probar la lógica de saldos y stock

Sin backend, sin variables de entorno, sin servicios de pago.

## 4. Modelo de datos

Todos los `id` son UUID (`crypto.randomUUID()`). Las fechas son ISO string. El dinero se guarda como entero (sin decimales). Los ml pueden tener un decimal.

```ts
Perfume {
  id, nombre, marca?,
  mlIniciales: number,        // tamaño de la botella al registrarla
  costoBotella?: number,      // opcional, para ganancias a futuro
  precios: { ml: number, precio: number }[],  // ej. 3ml, 5ml, 10ml
  archivado: boolean,
  creadoEn
}

Cliente {
  id, nombre, telefono?, nota?, creadoEn
}

Venta {
  id, clienteId, fecha, nota?,
  items: { perfumeId, ml: number, cantidad: number, precioUnitario: number }[],
  total: number,              // suma de items, guardada al crear
  anulada: boolean
}

Pago {
  id, clienteId, monto: number, fecha, metodo?: 'efectivo' | 'transferencia' | 'otro', nota?
}

AjusteStock {
  id, perfumeId, ml: number,  // negativo = merma/derrame, positivo = corrección
  motivo, fecha
}
```

### Reglas (valores calculados, nunca guardados)

- **Saldo de un cliente** = suma de sus ventas no anuladas − suma de sus pagos.
  - Saldo > 0: debe. Saldo = 0: al día. Saldo < 0: tiene saldo a favor.
- **ml restantes de un perfume** = `mlIniciales` − suma de (`ml` × `cantidad`) en ventas no anuladas + suma de ajustes.
- **Stock bajo**: ml restantes ≤ umbral configurable (por defecto 10 ml).
- Los pagos son abonos a la cuenta del cliente, no a una venta puntual. Permite pagos parciales sin complicar la app.
- Nada se borra: las ventas se anulan, los perfumes se archivan. Un pago mal ingresado sí se puede eliminar, con confirmación.
- Al vender se permite superar los ml restantes, pero con advertencia visible (la botella real manda; se corrige con un ajuste).

Estas reglas van en funciones puras en `src/lib/calculos.ts`, con pruebas.

## 5. Pantallas

Navegación inferior con 4 pestañas y un botón central "Nueva venta".

1. **Inicio**
   - Total por cobrar.
   - Lista de deudores ordenada de mayor a menor deuda.
   - Perfumes con stock bajo.
2. **Nueva venta** (el flujo más usado, debe tomar menos de 20 segundos)
   - Elegir cliente (buscador; crear uno nuevo ahí mismo).
   - Agregar items: perfume → tamaño (botones con los precios guardados) → cantidad. Precio editable.
   - Interruptor "Pagó ahora": si está activo, crea el pago por el total junto con la venta. También acepta un abono parcial.
3. **Clientes**
   - Lista con buscador y saldo de cada uno; filtro "Solo deudores".
   - Detalle: saldo, historial mezclado de ventas y pagos por fecha, botón "Registrar pago", botón "Recordar por WhatsApp" (abre `https://wa.me/<telefono>?text=...` con el monto adeudado; no envía nada solo).
4. **Perfumes**
   - Lista con barra de ml restantes y marca de stock bajo.
   - Detalle: precios por tamaño, historial de ventas, "Ajustar stock", "Archivar".
   - Formulario para crear / editar.
5. **Ajustes**
   - Exportar respaldo (descarga JSON con fecha en el nombre).
   - Importar respaldo (reemplaza todo, con confirmación).
   - Umbral de stock bajo, símbolo de moneda.

Diseño: pensado primero para celular, botones grandes, texto en español, montos con separador de miles.

## 6. Estructura del proyecto

```
decants-app/
  src/
    db/            esquema Dexie y tipos
    lib/           calculos.ts, formato.ts, respaldo.ts (+ pruebas)
    pages/         Inicio, NuevaVenta, Clientes, ClienteDetalle, Perfumes, PerfumeDetalle, Ajustes
    components/    piezas reutilizables (BarraStock, Monto, Buscador, NavInferior...)
    App.tsx, main.tsx
  public/          íconos de la PWA
  vite.config.ts
```

## 7. Fases de ejecución

Cada fase termina con la app funcionando y un commit. No avanzar si el criterio no se cumple.

### Fase 0 — Base
- Crear el proyecto con Vite (React + TS), Tailwind, React Router, Dexie, Vitest.
- `git init`, navegación inferior con las 5 pantallas vacías.
- **Listo cuando:** `npm run dev` abre la app y se puede navegar entre pantallas; `npm run build` pasa.

### Fase 1 — Datos y lógica
- Esquema Dexie y tipos de la sección 4.
- `calculos.ts`: `saldoCliente`, `mlRestantes`, `tieneStockBajo`, `totalPorCobrar`.
- Pruebas: pagos parciales, saldo a favor, ventas anuladas, ajustes positivos y negativos, cantidades mayores a 1.
- **Listo cuando:** `npm test` pasa.

### Fase 2 — Perfumes
- Lista, crear, editar, detalle, ajustar stock, archivar.
- **Listo cuando:** se puede crear un perfume de 100 ml, registrar un ajuste de −5 y ver 95 ml restantes.

### Fase 3 — Clientes y pagos
- Lista con saldo y filtro, crear, editar, detalle con historial, registrar y eliminar pago.
- **Listo cuando:** un cliente con pagos registrados muestra el saldo correcto.

### Fase 4 — Ventas
- Flujo de nueva venta completo, con "Pagó ahora" y abono parcial; anular venta desde el historial.
- **Listo cuando:** vender 2 × 5 ml descuenta 10 ml del perfume y aumenta la deuda del cliente; anular la venta revierte ambos.

### Fase 5 — Inicio
- Total por cobrar, deudores, stock bajo. Botón de WhatsApp en el detalle del cliente.
- **Listo cuando:** los números del inicio coinciden con los de las pantallas de detalle.

### Fase 6 — Respaldo, PWA y publicación
- Exportar / importar JSON con validación del archivo; aviso si pasaron más de 7 días sin exportar.
- `vite-plugin-pwa`: manifest, íconos, funcionamiento offline.
- Publicar en GitHub Pages (configurar `base` en Vite y un workflow de GitHub Actions).
- **Listo cuando:** la app se instala en un celular, funciona en modo avión, y exportar → borrar datos → importar devuelve todo igual.

## 8. Supuestos a confirmar con el vendedor

No bloquean el inicio; cambian detalles menores.

- Usa un solo celular para llevar el negocio.
- Vende en tamaños fijos (ej. 3, 5, 10 ml) con precio por tamaño.
- Acepta pagos parciales (abonos).
- Los precios no usan decimales.

## 9. Mejoras futuras (fuera de la versión 1)

- Sincronización en la nube y uso desde varios dispositivos (Supabase, plan gratuito).
- Ganancia por perfume y por mes (usa `costoBotella`).
- Varias botellas del mismo perfume / reposición de stock.
- Catálogo público para compartir con clientes.
- Fecha de vencimiento de deudas y recordatorios.
- Fotos de los perfumes.

## 10. Instrucción para ejecutar

Abrir una sesión en la carpeta `decants-app` con el modelo Sonnet y pedir:

> Lee PLAN.md y ejecuta la Fase 0. Al terminar, verifica el criterio "Listo cuando", haz commit y espera mi confirmación antes de pasar a la siguiente fase.

Repetir fase por fase. Probar cada fase en el celular antes de seguir.
