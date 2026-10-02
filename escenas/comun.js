// Utilidades compartidas por las escenas.

// Color de la paleta ([r, g, b]) con opacidad, para el contexto 2D del canvas.
function rgba(color, alfa) {
  return `rgba(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0}, ${Math.max(0, Math.min(1, alfa))})`;
}

// Mezcla lineal entre dos colores de la paleta.
function mezclar(c1, c2, t) {
  return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
}

// Acerca un color a otro un poco cada cuadro (cambios de color suaves).
function acercarColor(actual, objetivo, t) {
  const d = Math.abs(actual[0] - objetivo[0]) + Math.abs(actual[1] - objetivo[1]) + Math.abs(actual[2] - objetivo[2]);
  return d < 3 ? objetivo : mezclar(actual, objetivo, t);
}

// Curva de aceleración suave entre 0 y 1 (arranca y termina despacio).
function suavizar(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

// Escala logarítmica entre 0 y 1: el ojo percibe la intensidad de forma
// logarítmica, así que una onda que pierde energía se sigue viendo lejos.
function escalaLog(valor, minimo, maximo) {
  if (valor <= minimo) return 0;
  return Math.min(1, Math.log(valor / minimo) / Math.log(maximo / minimo));
}

// ---------- Tipos de persona ----------

const MASA_TIPO = { experiencia: 3, joven: 1, hibrido: 2, mundo: 1 };

// Color de una persona joven según su tono (0..1) en el degradado del logo de
// la UPB: rojo-rosa (0) → magenta (0,5) → violeta (1).
function colorJoven(tono = 0.5) {
  const [a, b, c] = CONFIG.paleta.jovenes;
  const t = Math.max(0, Math.min(1, tono));
  return t < 0.5 ? mezclar(a, b, t * 2) : mezclar(b, c, (t - 0.5) * 2);
}

// Color de cada tipo: experiencia blanca (crema), jóvenes en el degradado de la
// UPB (cada joven conserva su tono toda la charla), híbridos mezcla de ambos,
// mundo gris.
function colorDeTipo(tipo, p) {
  const P = CONFIG.paleta;
  const tono = p?.tono ?? 0.5;
  if (tipo === "experiencia") return P.experiencia;
  if (tipo === "joven") return colorJoven(tono);
  if (tipo === "hibrido") return mezclar(P.experiencia, colorJoven(tono), 0.5);
  return P.mundo;
}

// ---------- Geometría ----------

// Sitios de una retícula hexagonal, ordenados del centro hacia afuera.
// Cada sitio tiene coordenadas axiales (q, r) y una "clase" 0, 1 o 2 que colorea
// la retícula de forma que dos sitios vecinos nunca tienen la misma clase.
function discoHex(n, sep, cx, cy, { desorden = 0 } = {}) {
  const R = Math.ceil(Math.sqrt(n / 3)) + 2;
  const sitios = [];
  for (let q = -R; q <= R; q += 1) {
    for (let r = -R; r <= R; r += 1) {
      if (Math.abs(q + r) > R) continue;
      const x0 = sep * (q + r / 2);
      const y0 = sep * (Math.sqrt(3) / 2) * r;
      const d = Math.round(Math.hypot(x0, y0) * 1000) / 1000;
      sitios.push({ q, r, d, x0, y0, clase: (((q - r) % 3) + 3) % 3 });
    }
  }
  sitios.sort((a, b) => a.d - b.d || a.q - b.q || a.r - b.r);
  return sitios.slice(0, n).map((s) => ({
    ...s,
    x: cx + s.x0 + (desorden ? random(-desorden, desorden) * sep : 0),
    y: cy + s.y0 + (desorden ? random(-desorden, desorden) * sep : 0),
  }));
}

// Pares de sitios vecinos de una retícula hexagonal (cada par una sola vez).
function vecinosHex(sitios) {
  const indice = new Map(sitios.map((s, i) => [`${s.q},${s.r}`, i]));
  const pares = [];
  sitios.forEach((s, i) => {
    for (const [dq, dr] of [
      [1, 0],
      [0, 1],
      [-1, 1],
    ]) {
      const j = indice.get(`${s.q + dq},${s.r + dr}`);
      if (j !== undefined) pares.push([i, j]);
    }
  });
  return pares;
}

const DIRECCIONES_HEX = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

// Punto al azar dentro de una elipse.
function puntoEnElipse(cx, cy, rx, ry) {
  let x;
  let y;
  do {
    x = random(-1, 1);
    y = random(-1, 1);
  } while (x * x + y * y > 1);
  return [cx + x * rx, cy + y * ry];
}

function centroDe(nodos) {
  let x = 0;
  let y = 0;
  for (const p of nodos) {
    x += p.x;
    y += p.y;
  }
  return { x: x / nodos.length, y: y / nodos.length };
}

function masaDe(nodos) {
  return nodos.reduce((s, p) => s + p.masa, 0);
}

function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
