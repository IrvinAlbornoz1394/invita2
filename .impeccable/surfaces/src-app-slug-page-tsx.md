---
version: 1
slug: "src-app-slug-page-tsx"
primary_target: "src/app/[slug]/page.tsx"
related_targets: ["src/components/invitation/Invitation.tsx"]
---

# Invitación `/<slug>` — surface brief

Scope: invitación pública de cada festejado (y su vista previa en `/admin/vista/[id]`). Visitor mode: **Experience** con piezas de Operate (fecha, lugar, confirmar). Prioridad absoluta: celular (390 px), abierta desde WhatsApp.

Audiencia y acción: invitados (familias) que abren el enlace en el celular; deben enterarse de cuándo, dónde y qué habrá y confirmar por WhatsApp. También es la vitrina que vende invita2: el papá que cotiza la ve como ejemplo; debe verse más profesional que las invitaciones web de la competencia.

## Direction contract

THESIS: la invitación es una app hecha solo para el festejado: portada a pantalla completa con el fondo y los personajes del tema y, encima, una hoja redondeada que sube como en una app y agrupa todo en paneles limpios. Una barra inferior fija (música · cómo llegar · confirmar) deja lo práctico a un toque, siempre.

OWN-WORLD: dirigido por tema. Los 6 colores del tema se usan con jerarquía: principal para títulos y acción, tintes suaves derivados (color-mix con blanco) para fondos de íconos y chips, tinta del tema para el texto, superficie del tema para la hoja. Paneles blancos de 16–20 px con sombra suave y larga teñida de la tinta; nada de bordes blancos gruesos ni sombras de bloque. Títulos con la tipografía del tema (Lilita, Luckiest, Titan, Chewy, Fredoka, Bubblegum) en color sólido, sin contornos gruesos; texto y datos en Poppins (400–700, cifras tabulares).

STORY: abre el regalo (apertura del tema) → confeti y la portada: logo, nombre grande, edad, foto, y un resumen fecha·hora·lugar → la hoja sube: tarjeta del tema, cuenta regresiva, fecha/hora/lugar en lista agrupada con mapa y botones, show con artistas en carrusel, extras, galería, mensaje, confirmación → pie con el nombre.

FIRST VIEWPORT: celular (390): tras la apertura, portada con el fondo del tema (rayos/degradado/lunares/imagen) suavizado, logo del tema arriba, nombre en la fuente del tema a gran tamaño, etiqueta de edad, foto circular si hay, chip de resumen «sáb 12 dic · 5:00 p.m.», y el borde de la hoja asomando abajo; barra inferior flotante con música y Confirmar.

FORM: rumbo elegido por el usuario: «Scroll premium tipo app» (frente a formato historias y pase VIP); el usuario dio pase libre para mejorar tipografía y colores. Señal: la hoja que sube sobre la portada y los personajes del tema asomándose por encima de los paneles. Movimiento: un solo momento de autor (apertura → confeti → entrada escalonada de la portada); el resto, entradas cortas con ease-out exponencial y sin rebotes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
