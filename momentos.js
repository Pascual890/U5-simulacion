// Guion del cliente: 13 momentos en orden fijo (no se puede alterar la secuencia).
//
// Cada momento tiene:
//   id       -> nombre corto para referirse a él
//   tipo     -> "portada", "frase" o "cierre" (cambia la composición del texto)
//   texto    -> una línea por oración, en español (es) y portugués (pt)
//   escena   -> la escena de partículas que lo interpreta (ver sketch.js y escenas/)
//   porPasos -> opcional. cada oración aparece con una pulsación de tecla y la
//               escena cambia con ella (paso 0 = primera oración)
//   foto     -> opcional. modo "fondo" (ocupa toda la pantalla, oscurecida) o
//               "lateral" (recuadro a la derecha). "posicion" elige qué parte de
//               la foto se ve cuando se recorta (como object-position en CSS).

window.MOMENTOS = [
  {
    id: "relevo",
    tipo: "portada",
    texto: {
      es: ["Relevo generacional:", "la ventaja que nadie está aprovechando"],
      pt: ["Relevo geracional:", "a vantagem que ninguém está aproveitando"],
    },
    subtitulo: "@centrodeeventosupb",
    escena: "potencial",
  },
  {
    id: "auditorio",
    tipo: "frase",
    texto: {
      es: ["¿Un gran auditorio solo para hacer grados?"],
      pt: ["Um grande auditório só para formaturas?"],
    },
    escena: "grados",
    foto: { src: "./assets/fotos/foto-1-grados.jpg", modo: "fondo" },
  },
  {
    id: "universidad-mundo",
    tipo: "frase",
    texto: {
      es: ["Los eventos no llegaron a la Universidad.", "La Universidad decidió encontrarse con el mundo."],
      pt: ["Os eventos não chegaram à Universidade.", "A Universidade decidiu se encontrar com o mundo."],
    },
    escena: "encuentro",
    porPasos: true,
  },
  {
    id: "academia-industria-ciudad",
    tipo: "frase",
    texto: {
      es: ["Academia + Industria + Ciudad"],
      pt: ["Academia + Indústria + Cidade"],
    },
    escena: "triada",
    foto: { src: "./assets/fotos/foto-2-academia-industria-ciudad.jpg", modo: "fondo", posicion: "50% 62%" },
  },
  {
    id: "impacto",
    tipo: "frase",
    texto: {
      es: ["Los eventos nunca fueron el objetivo.", "El impacto sí."],
      pt: ["Os eventos nunca foram o objetivo.", "O impacto, sim."],
    },
    escena: "impacto",
    porPasos: true,
    foto: { src: "./assets/fotos/foto-3-impacto.jpg", modo: "fondo" },
  },
  {
    id: "comunidad",
    tipo: "frase",
    texto: {
      es: ["Un evento trae personas.", "Una comunidad trae transformación."],
      pt: ["Um evento traz pessoas.", "Uma comunidade traz transformação."],
    },
    escena: "comunidad",
    porPasos: true,
  },
  {
    id: "confianza",
    tipo: "frase",
    texto: {
      es: ["El talento crece a la velocidad de la confianza."],
      pt: ["O talento cresce na velocidade da confiança."],
    },
    escena: "confianza",
  },
  {
    id: "rutas",
    tipo: "frase",
    texto: {
      es: ["La experiencia construye el camino.", "Las nuevas generaciones descubren nuevas rutas."],
      pt: ["A experiência constrói o caminho.", "As novas gerações descobrem novas rotas."],
    },
    escena: "rutas",
    porPasos: true,
    foto: { src: "./assets/fotos/foto-4-rutas.jpg", modo: "fondo" },
  },
  {
    id: "vision",
    tipo: "frase",
    texto: {
      es: ["Una visión.", "Dos generaciones."],
      pt: ["Uma visão.", "Duas gerações."],
    },
    escena: "vision",
  },
  {
    id: "juntas",
    tipo: "frase",
    texto: {
      es: ["El crecimiento no ocurre cuando una generación reemplaza a otra.", "Ocurre cuando trabajan juntas."],
      pt: ["O crescimento não acontece quando uma geração substitui a outra.", "Acontece quando trabalham juntas."],
    },
    escena: "juntas",
    porPasos: true,
  },
  {
    id: "presente",
    tipo: "frase",
    texto: {
      es: ["Los jóvenes no son el futuro.", "Son el presente que muchas organizaciones aún no ven."],
      pt: ["Os jovens não são o futuro.", "São o presente que muitas organizações ainda não veem."],
    },
    escena: "presente",
    porPasos: true,
  },
  {
    id: "futuro",
    tipo: "frase",
    texto: {
      es: ["El futuro no se hereda.", "Se construye."],
      pt: ["O futuro não se herda.", "Se constrói."],
    },
    escena: "futuro",
    porPasos: true,
    foto: { src: "./assets/fotos/foto-5-futuro.jpg", modo: "fondo", posicion: "50% 58%" },
  },
  {
    id: "cierre",
    tipo: "cierre",
    texto: {
      es: ["@centrodeeventosupb"],
      pt: ["@centrodeeventosupb"],
    },
    escena: "cierre",
    foto: { src: "./assets/fotos/foto-6-cierre.jpg", modo: "fondo" },
  },
];
