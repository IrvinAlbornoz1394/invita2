# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Papás y mamás que organizan la fiesta infantil** (clientes): llegan a la landing, casi siempre desde el celular, para ver un ejemplo y cotizar por WhatsApp. Deciden si la invitación vale la pena frente a una tarjeta impresa o una imagen de Canva.
- **Invitados** (familias de otros niños): abren el enlace que les llegó por WhatsApp en el celular, quieren saber cuándo, dónde y qué habrá, y confirmar asistencia.
- **El operador de invita2** (administrador): arma cada invitación y cada tema en el panel `/admin`, normalmente desde la computadora, con los datos que le manda el cliente.

## Product Purpose

invita2 vende invitaciones web animadas para fiestas infantiles. Se abren desde un enlace (sin apps), con los personajes favoritos del festejado, música, cuenta regresiva, mapa, show, extras, galería y confirmación por WhatsApp. El éxito es que el cliente cotice y que los invitados lleguen a la fiesta y confirmen.

## Positioning

Es un servicio hecho a mano: el operador arma la invitación por el cliente, con un tema (set de personajes) que define colores, tipografía, ilustraciones, fondo y música. Cambiar un tema actualiza al instante todas sus invitaciones.

## Operating Context

- El canal comercial y de entrega es WhatsApp: la landing cotiza por WhatsApp, la invitación se comparte por WhatsApp (con vista previa) y los invitados confirman por WhatsApp.
- Las invitaciones tienen dirección particular (`/<nombre>-<hash>`), llevan `noindex` y redirigen a la landing si no existen o están en borrador.
- Mercado: México (zonas horarias mexicanas, textos en español de México; datos de ejemplo de Mérida).

## Capabilities and Constraints

- Stack existente: Next.js 16 + Supabase (BD, auth, archivos), desplegado en Vercel. Invitaciones cacheadas con `"use cache"` + `cacheTag`.
- Superficies: landing `/`, invitación `/<slug>`, panel `/admin` (login, invitaciones, temas, vista previa).
- La invitación es **dirigida por tema**: cada tema aporta 6 colores, fondo (rayos, degradado, lunares o imagen), tipografía de títulos (Lilita, Luckiest Guy, Titan One, Chewy, Fredoka, Bubblegum), logo, imagen de tarjeta, imagen de grupo, elementos flotantes por sección y música. Cualquier rediseño de la invitación debe seguir funcionando con todos estos parámetros.
- Secciones de la invitación: apertura (regalo, globo o imagen), portada, tarjeta, cuenta regresiva, fecha/lugar/mapa, show, extras, galería, mensaje, confirmación, pie. Varias se pueden ocultar; los textos son editables y admiten `{nombre}` y `{edad}`.
- Variables opcionales de la landing: `NEXT_PUBLIC_DEMO_SLUG` (ejemplo) y `NEXT_PUBLIC_CONTACT_WHATSAPP` (cotizar); la landing debe verse bien sin ellas.

## Brand Commitments

- Nombre: **invita2**. No hay logo; se usa un logotipo tipográfico.
- Landing (decidido por el usuario el 2026-11-03, tras descartar la lotería): estilo de **landing de producto digital / app** — fondo lila claro, morado de marca, celulares flotando inclinados con la invitación real, tarjetas blancas con sombra suave, franja morada de funciones, preguntas frecuentes y banner final. Referencia: plantilla tipo «Payvit» que el usuario compartió. Sin logos de socios, cifras ni testimonios inventados.
- Prioridad móvil: el usuario pidió explícitamente que el celular sea lo prioritario; se diseña primero a 390 px.
- Voz: español de México, cercana y cálida ("Hechas con cariño"); dentro de la invitación habla el festejado en primera persona ("¡Ven a celebrar conmigo!").

## Evidence on Hand

- Tema incluido "Bely y Beto" (`public/temas/bely-beto/`) y la invitación estática original en `legacy/`.
- No hay testimonios, precios, número de clientes ni casos publicados: no inventarlos.

## Product Principles

1. El celular manda: todo se usa primero desde un enlace de WhatsApp en un teléfono.
2. La invitación es del festejado y de su tema, no de invita2: la marca se queda atrás.
3. Lo práctico nunca se esconde: fecha, hora, lugar y confirmar deben encontrarse sin esfuerzo, por más fiesta que tenga el diseño.
4. El panel es una herramienta de trabajo: rapidez y claridad por encima de la decoración.
