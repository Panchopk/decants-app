# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Un solo vendedor de decants de perfume (confirmado por el dueño del proyecto), que usa la app desde su celular, normalmente con una mano, entre clientes. No hay clientes ni terceros que vean la app. No hay cuentas ni inicio de sesión.

## Product Purpose

Resolver tres olvidos del vendedor: quién le debe dinero y cuánto, quién ya pagó, y cuántos ml le quedan de cada perfume. Más adelante se suma saber cuántos decants vendió de cada perfume, para deducir cuánto perfume usó él para uso personal. Éxito: registrar una venta en menos de 20 segundos y ver de un vistazo el total por cobrar.

## Positioning

Herramienta personal, sin servidor y sin costo: todos los datos viven en el celular del vendedor y la app funciona sin internet. Un contador de deudas y stock hecho a la medida de un vendedor de decants, no un sistema de punto de venta.

## Operating Context

- Se usa de pie, en movimiento o atendiendo gente, con una mano y atención partida.
- Pagos parciales (abonos) a la cuenta del cliente, no a una venta puntual.
- Tamaños fijos con precio por tamaño (por ejemplo 3, 5 y 10 ml); precios sin decimales.
- Recordatorio de cobro por WhatsApp (abre `wa.me`, no envía solo).
- Respaldo manual: exportar e importar un archivo JSON. Aviso si pasan más de 7 días sin exportar.
- Publicada como PWA en GitHub Pages: https://panchopk.github.io/decants-app/

## Capabilities and Constraints

- Moneda sin decimales, con separador de miles; el símbolo de moneda es configurable en Ajustes.
- Los ml pueden tener un decimal.
- Nada se borra: las ventas se anulan y los perfumes se archivan. Un pago mal ingresado sí se puede eliminar, con confirmación.
- Al vender se permite superar los ml restantes, con advertencia visible.
- Sin servidor, sin variables de entorno y sin servicios de pago. Política de seguridad del build: solo recursos propios (`'self'`), sin fuentes ni scripts externos.
- No cambiar el esquema de la base de datos local sin un plan de migración: el vendedor ya tendrá datos guardados.
- Interfaz en español.
- Indefinido: si habrá más de un dispositivo o sincronización en la nube (queda como mejora futura).

## Brand Commitments

- Nombre: "Decants".
- Voz: **neutra, sin dirigirse al vendedor** (decisión confirmada). Usar etiquetas y verbos en infinitivo o sustantivos ("Nuevo perfume", "Exportar respaldo"), no "tú" ni "usted".
- Dirección visual: **se conserva el estilo actual** (índigo y gris azulado de Tailwind, tipografía del sistema). El dueño probó una dirección "cálida y de lujo" y la descartó. Sí se quiere un selector de tema claro / oscuro / automático (ya implementado) y mejoras de interacción (ver `PLAN-DISENO.md`). No proponer cambios de paleta ni de tipografía sin que el dueño los pida.

## Evidence on Hand

- `PLAN.md` y `PLAN-DISENO.md` describen el producto y las mejoras previstas.
- No hay testimonios, clientes de referencia, métricas de uso ni fotos de perfumes; no inventarlos.

## Product Principles

1. Velocidad primero: lo más frecuente (vender, cobrar) debe tomar pocos toques y caber en la zona del pulgar.
2. Los números mandan: deudas, saldos y ml deben leerse de un vistazo, con cifras alineadas y sin ambigüedad.
3. Los datos del vendedor son suyos y viven en su celular: nada sale sin que él lo exporte, y todo cambio debe cuidar los datos ya guardados.
4. Nada se pierde en silencio: anular en vez de borrar, avisar antes de reemplazar datos, confirmar lo que se guardó.
5. Funciona sin internet y sin sorpresas.

## Accessibility & Inclusion

- Objetivos táctiles de al menos 44 px.
- Contraste AA mínimo, también en modo oscuro.
- El estado (debe, al día, a favor, stock bajo) nunca se comunica solo con color: siempre con texto.
- Respetar `prefers-reduced-motion`.
