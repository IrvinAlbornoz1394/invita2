# Invitación · Lucero Jeamileth · Mi primer añito

Invitación web animada con temática de Bely y Beto (HTML + CSS + JS, sin dependencias ni build).

## Estructura

```
invita2/
├── index.html                ← estructura de la página
├── css/styles.css            ← estilos, colores (variables en :root) y animaciones
├── js/
│   ├── config.js             ← ✏️ textos, fecha, dirección, WhatsApp, imágenes y música
│   └── main.js               ← lógica (regalo, música, confeti, globos, cuenta regresiva, RSVP)
└── assets/
    ├── index.html            ← invitación original (solo referencia, no se usa)
    ├── img/
    │   ├── lucero.jpg            ← foto de Lucero (extraída de la invitación original)
    │   ├── fondo-bely-beto.jpg   ← tarjeta ilustrada (extraída de la invitación original)
    │   ├── images.png            ← logo Bely y Beto
    │   ├── images.jpg            ← grupo de personajes
    │   └── images (1).jpg        ← hoja de 8 personajes (se recorta en 4 × 2)
    └── audio/bely-y-beto.mp3     ← empieza en el segundo 4 (config.musica.inicio)
```

## Ver en local

```bash
npx http-server -p 8080     # recomendado
# o: python3 -m http.server 8080
```

> `python3 -m http.server` no soporta peticiones por rango, así que en él la música
> empieza desde el segundo 0. En cualquier hosting real (Netlify, Vercel, GitHub Pages)
> y con `npx http-server` sí salta al segundo 4.

## Pendiente

- `whatsapp` en `js/config.js`: pon el número que recibirá las confirmaciones.
