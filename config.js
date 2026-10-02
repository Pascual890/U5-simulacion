// Configuración general. Todo lo que se cambia sin tocar la lógica va aquí.
window.CONFIG = {
  // Idioma con el que abre la presentación: "es" o "pt" (la charla original fue en Brasil).
  idioma: "es",

  // Línea que acompaña el título en el momento 1.
  evento: "Future Leaders Forum · Fórum UPB",

  // Enlaces de los QR del cierre (momento 13).
  enlaces: {
    // Pon aquí la URL donde publiques la presentación (por ejemplo GitHub Pages).
    // Mientras esté vacío, el QR de memorias aparece como pendiente.
    memorias: "",
    redes: "https://www.instagram.com/centrodeeventosupb/",
  },

  // Textos de la interfaz que dependen del idioma.
  textosInterfaz: {
    es: { memorias: "Memorias", redes: "@centrodeeventosupb", pendiente: "Enlace pendiente" },
    pt: { memorias: "Anais", redes: "@centrodeeventosupb", pendiente: "Link pendente" },
  },

  // Duración (ms) del fundido del texto al cambiar de momento.
  fundidoTexto: 450,

  // Colores del sistema de partículas (en RGB para poder variar la opacidad).
  // La experiencia es blanca (el crema de la marca Fórum). Las nuevas
  // generaciones, la generación universitaria, llevan el degradado del logo
  // nuevo de la UPB: rojo-rosa → magenta → violeta. Cada joven tiene su propio
  // punto en ese degradado y lo conserva toda la charla.
  paleta: {
    experiencia: [244, 241, 234], // blanco crema de la marca Fórum
    jovenes: [
      [246, 18, 84], // rojo-rosa (#F40856 en el logo)
      [218, 34, 160], // magenta (#D61E9C)
      [178, 66, 252], // violeta (#AE3CFC)
    ],
    talento: [255, 246, 222], // blanco cálido: el destello donde nace un impulso
    mundo: [150, 156, 166], // gris: personas sin vínculo con la estructura
  },
};
