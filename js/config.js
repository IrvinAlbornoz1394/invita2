/* ==========================================================================
   CONFIGURACIÓN DE LA INVITACIÓN
   Todo el contenido se edita aquí. No necesitas tocar el HTML.
   ========================================================================== */
window.INVITACION = {
  nombre: ["Lucero", "Jeamileth"], // cada palabra va en su propio renglón
  edad: 1,
  edadTexto: "Mi primer añito",

  // Fecha y hora (formato ISO, hora local)
  fecha: "2026-11-13T16:00:00",
  horaTexto: "4:00 p. m.",

  lugar: {
    direccion: "Calle 105 #416, por 52 y 50",
    colonia: "Colonia Dolores Otero, Mérida, Yucatán",
    mapa: "https://www.google.com/maps/search/?api=1&query=Calle+105+%23416+por+52+y+50+Dolores+Otero+M%C3%A9rida+Yucat%C3%A1n",
    mapaEmbed: "https://maps.google.com/maps?q=Calle+105+416+Dolores+Otero+M%C3%A9rida+Yucat%C3%A1n&z=16&output=embed",
  },

  mensaje:
    "Ven a compartir sonrisas y momentos inolvidables conmigo. Prepara tus ganas de bailar, jugar y pasarla increíble.",

  imagenes: {
    foto: "assets/img/lucero.jpg",
    tarjeta: "assets/img/fondo-bely-beto.jpg",
    logo: "assets/img/images.png",
    grupo: "assets/img/images.jpg",
    personajes: "assets/img/images (1).jpg", // hoja de 4 × 2 personajes
  },

  musica: {
    archivo: "assets/audio/bely-y-beto.mp3",
    inicio: 4, // segundos que se omiten al inicio (y al repetir)
  },

  // Número con lada de país, sin + ni espacios (ej. 5219991234567).
  // Si se deja vacío, WhatsApp pedirá elegir el contacto.
  whatsapp: "",
};
