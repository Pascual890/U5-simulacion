// Sistema de partículas (p5.js).
// Cada momento del guion tiene una "escena" (ver momentos.js): una clase con su
// propio mundo físico, que se actualiza y dibuja cada cuadro.
// Al cambiar de momento, la escena nueva hereda las partículas de la anterior
// (ver escenas/base.js): las personas se reorganizan en la nueva estructura en
// vez de desaparecer.

const ESCENAS = {
  potencial: EscenaPotencial,
  grados: EscenaGrados,
  encuentro: EscenaEncuentro,
  triada: EscenaTriada,
  impacto: EscenaImpacto,
  comunidad: EscenaComunidad,
  confianza: EscenaConfianza,
  rutas: EscenaRutas,
  vision: EscenaVision,
  juntas: EscenaJuntas,
  presente: EscenaPresente,
  futuro: EscenaFuturo,
  cierre: EscenaCierre,
};

let listo = false; // p5 ya ejecutó setup()
let avisoPendiente = null;
let escena = null;
let depurar = false;

function setup() {
  const lienzo = createCanvas(windowWidth, windowHeight);
  lienzo.parent("capa-particulas");
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  listo = true;
  if (avisoPendiente) cambiarMomento(avisoPendiente);
}

function crearEscena(momento, indice, paso, anterior) {
  const herencia = anterior ? anterior.herencia() : null;
  const e = new ESCENAS[momento.escena](width, height, paso, herencia);
  e.cerrarHerencia();
  Object.assign(e, { momento, indice, paso });
  return e;
}

function cambiarMomento({ indice, momento, paso }) {
  // Mismo momento, otro paso (por ejemplo, aparece la segunda oración).
  if (escena && escena.indice === indice) {
    if (paso < escena.paso) escena = crearEscena(momento, indice, paso, escena);
    else escena.setPaso(paso);
    return;
  }
  escena = momento.escena ? crearEscena(momento, indice, paso, escena) : null;
}

function draw() {
  clear(); // transparente: debajo están las fotos
  if (!escena) return;
  escena.actualizarBase();
  escena.actualizar();
  escena.dibujar(drawingContext);
  if (depurar) dibujarInfo(escena.info());
}

// Vista de depuración (tecla D): muestra los parámetros físicos de la escena.
function dibujarInfo(lineas) {
  noStroke();
  fill(244, 241, 234, 190);
  textFont("monospace");
  textSize(Math.max(12, Math.min(width, height) / 60));
  textAlign(RIGHT, BOTTOM);
  const alto = textSize() * 1.5;
  const base = height * 0.88 - (lineas.length - 1) * alto;
  lineas.forEach((l, i) => text(l, width * 0.94, base + i * alto));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (escena) escena = crearEscena(escena.momento, escena.indice, escena.paso, escena);
}

// La tecla D es solo para ensayar: no aparece en la ayuda de la presentación.
function keyPressed() {
  if (key === "d" || key === "D") depurar = !depurar;
}

// main.js avisa cada vez que cambia el momento o el paso dentro de un momento.
document.addEventListener("momento", (e) => {
  if (listo) cambiarMomento(e.detail);
  else avisoPendiente = e.detail;
});
