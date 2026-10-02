// Control de la presentación: qué momento se ve, texto, fotos, idioma y teclado.
// No sabe nada de partículas: cuando cambia el momento, avisa con el evento
// "momento" y sketch.js decide qué hacer con eso.

const escenario = document.querySelector("#escenario");
const capaTexto = document.querySelector("#capa-texto");
const antetitulo = document.querySelector("#antetitulo");
const frase = document.querySelector("#frase");
const subtitulo = document.querySelector("#subtitulo");
const contador = document.querySelector("#contador");
const ayuda = document.querySelector("#ayuda");
const marcosFoto = [document.querySelector("#foto-a"), document.querySelector("#foto-b")];

const estado = {
  indice: 0,
  paso: 0, // en momentos con "porPasos", cuántas oraciones se han revelado (0 = la primera)
  idioma: CONFIG.idioma,
  marcoActivo: 0, // cuál de los dos marcos de foto está visible
  temporizadorTexto: 0,
};

function dosDigitos(n) {
  return String(n).padStart(2, "0");
}

// ---------- Texto ----------

function pintarTexto(momento) {
  const lineas = momento.texto[estado.idioma] || momento.texto.es;

  capaTexto.dataset.tipo = momento.tipo;
  capaTexto.classList.toggle("es-larga", lineas.join(" ").length > 70);
  if (momento.escena) escenario.dataset.escena = momento.escena;
  else delete escenario.dataset.escena;

  antetitulo.textContent = momento.tipo === "portada" ? CONFIG.evento : "";
  subtitulo.textContent = momento.subtitulo || "";

  // Cada oración en su propio bloque: así el salto entre frases es una decisión
  // de diseño y no un accidente del ancho de pantalla.
  frase.replaceChildren(
    ...lineas.map((linea) => {
      const span = document.createElement("span");
      span.className = "linea";
      span.textContent = linea;
      return span;
    }),
  );
  mostrarPasos(momento);
}

// En un momento por pasos, las oraciones siguientes esperan ocultas (ocupando
// su lugar, para que el texto no salte cuando aparecen).
function mostrarPasos(momento) {
  frase.querySelectorAll(".linea").forEach((linea, i) => {
    linea.classList.toggle("oculta", Boolean(momento.porPasos) && i > estado.paso);
  });
}

// ---------- Fotos ----------

function pintarFoto(momento) {
  const actual = marcosFoto[estado.marcoActivo];
  const srcActual = actual.classList.contains("visible") ? actual.querySelector("img").getAttribute("src") : null;
  const srcNueva = momento.foto?.src || null;

  // Misma foto (o ninguna en ambos casos): solo actualiza el modo.
  if (srcActual === srcNueva) {
    if (momento.foto) actual.dataset.modo = momento.foto.modo;
    return;
  }

  // Fundido cruzado: el marco que estaba visible se apaga y el otro se enciende.
  actual.classList.remove("visible");
  if (!srcNueva) return;

  estado.marcoActivo = 1 - estado.marcoActivo;
  const siguiente = marcosFoto[estado.marcoActivo];
  const img = siguiente.querySelector("img");
  siguiente.dataset.modo = momento.foto.modo;
  img.src = srcNueva;
  img.alt = momento.foto.alt || "";
  img.style.objectPosition = momento.foto.posicion || "";
  siguiente.classList.add("visible");
}

// ---------- QR del cierre ----------

function pintarQr(enlace, url, etiqueta) {
  const textos = CONFIG.textosInterfaz[estado.idioma];
  const codigo = enlace.querySelector(".qr-codigo");
  enlace.querySelector(".qr-etiqueta").textContent = etiqueta;

  if (!url) {
    enlace.removeAttribute("href");
    enlace.classList.add("pendiente");
    codigo.textContent = textos.pendiente;
    return;
  }

  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  enlace.href = url;
  enlace.classList.remove("pendiente");
  codigo.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}

function pintarQrs() {
  const textos = CONFIG.textosInterfaz[estado.idioma];
  pintarQr(document.querySelector("#qr-memorias"), CONFIG.enlaces.memorias, textos.memorias);
  pintarQr(document.querySelector("#qr-redes"), CONFIG.enlaces.redes, textos.redes);
}

// ---------- Cambio de momento ----------

function avisarParticulas() {
  const detalle = { indice: estado.indice, momento: MOMENTOS[estado.indice], paso: estado.paso };
  document.dispatchEvent(new CustomEvent("momento", { detail: detalle }));
}

function ultimoPaso(momento) {
  return momento.porPasos ? momento.texto.es.length - 1 : 0;
}

// alFinal: al llegar retrocediendo, el momento se muestra con todas sus oraciones.
function irA(indice, alFinal = false) {
  estado.indice = Math.max(0, Math.min(MOMENTOS.length - 1, indice));
  const momento = MOMENTOS[estado.indice];
  estado.paso = alFinal ? ultimoPaso(momento) : 0;

  escenario.dataset.momento = momento.id;
  escenario.dataset.tipo = momento.tipo;
  // Avance de la charla (0 en la portada, 1 en el cierre): mueve las luces del fondo.
  escenario.style.setProperty("--progreso", (estado.indice / (MOMENTOS.length - 1)).toFixed(3));
  contador.textContent = `${dosDigitos(estado.indice + 1)} / ${MOMENTOS.length}`;
  history.replaceState(null, "", `#${estado.indice + 1}`);

  // El texto sale, se reemplaza y vuelve a entrar.
  clearTimeout(estado.temporizadorTexto);
  capaTexto.classList.add("saliendo");
  estado.temporizadorTexto = setTimeout(() => {
    pintarTexto(momento);
    capaTexto.classList.remove("saliendo");
  }, CONFIG.fundidoTexto);

  pintarFoto(momento);
  avisarParticulas();
}

function avanzar() {
  const momento = MOMENTOS[estado.indice];
  if (estado.paso < ultimoPaso(momento)) {
    estado.paso += 1;
    mostrarPasos(momento);
    avisarParticulas();
  } else if (estado.indice < MOMENTOS.length - 1) {
    irA(estado.indice + 1);
  }
}

function retroceder() {
  const momento = MOMENTOS[estado.indice];
  if (estado.paso > 0) {
    estado.paso -= 1;
    mostrarPasos(momento);
    avisarParticulas();
  } else if (estado.indice > 0) {
    irA(estado.indice - 1, true);
  }
}

function cambiarIdioma() {
  estado.idioma = estado.idioma === "es" ? "pt" : "es";
  document.documentElement.lang = estado.idioma;
  pintarTexto(MOMENTOS[estado.indice]);
  pintarQrs();
}

async function pantallaCompleta() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
}

// ---------- Teclado (incluye los botones de un presentador inalámbrico) ----------

window.addEventListener("keydown", (e) => {
  const tecla = e.key;
  if (["ArrowRight", " ", "PageDown", "Enter"].includes(tecla)) avanzar();
  else if (["ArrowLeft", "PageUp", "Backspace"].includes(tecla)) retroceder();
  else if (tecla === "Home") irA(0);
  else if (tecla === "End") irA(MOMENTOS.length - 1);
  else if (tecla === "f" || tecla === "F") pantallaCompleta();
  else if (tecla === "l" || tecla === "L") cambiarIdioma();
  else if (tecla === "h" || tecla === "H") ayuda.hidden = !ayuda.hidden;
  else return;
  e.preventDefault();
});

// En celular: deslizar a la izquierda avanza, a la derecha retrocede.
let toqueInicioX = 0;
escenario.addEventListener("touchstart", (e) => (toqueInicioX = e.changedTouches[0].clientX));
escenario.addEventListener("touchend", (e) => {
  const delta = e.changedTouches[0].clientX - toqueInicioX;
  if (Math.abs(delta) > 40) (delta < 0 ? avanzar : retroceder)();
});

// El cursor se esconde si no se mueve, para que no quede sobre la pantalla grande.
let temporizadorCursor = 0;
window.addEventListener("mousemove", () => {
  escenario.classList.remove("sin-cursor");
  clearTimeout(temporizadorCursor);
  temporizadorCursor = setTimeout(() => escenario.classList.add("sin-cursor"), 2000);
});

// ---------- Inicio ----------

// Permite abrir directamente un momento con index.html#7 (útil para ensayar).
function indiceDesdeUrl() {
  const n = parseInt(location.hash.slice(1), 10);
  return Number.isFinite(n) ? n - 1 : 0;
}

window.addEventListener("hashchange", () => irA(indiceDesdeUrl()));
document.documentElement.lang = estado.idioma;
pintarQrs();
escenario.classList.add("inicio");
irA(indiceDesdeUrl());
requestAnimationFrame(() => requestAnimationFrame(() => escenario.classList.remove("inicio")));
