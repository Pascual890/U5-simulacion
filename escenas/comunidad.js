// Momento 6 · "Un evento trae personas. / Una comunidad trae transformación."
//
// Paso 1, el evento: llegan personas desde los bordes hacia el centro, se
// encuentran un rato y se van. Son anónimas (grises) y nadie se queda: el flujo
// entra y sale, y el centro nunca acumula nada.
// Paso 2, la comunidad: cuando dos personas se encuentran, se vinculan. Quien
// queda vinculado ya no se va, y recupera su identidad: el gris se vuelve
// crema (experiencia) o los colores de la UPB (jóvenes). La comunidad atrapa a quienes
// llegan y crece: transforma tanto a las personas como al flujo.
//
// Física: búsqueda (seek) con llegada, vida útil y vínculos que se forman por
// cercanía.

class EscenaComunidad extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(6);
    this.mundo.friccion = 0.05;
    this.sep = 32 * this.esc;
    this.vMax = 1.5 * this.esc;
    this.gris = CONFIG.paleta.mundo;
    this.visitantes = [];
    this.comunidad = [];
    this.pares = new Set();
    this.proximo = 0;
    this.maxComunidad = 110;

    // Las personas del momento anterior quedan como asistentes que ya se están yendo
    // (o que se quedan, si se llega aquí con la comunidad ya formada).
    for (const q of barajar(this.disponibles).slice(0, 40)) {
      const p = this.adoptarDirecto(q, { masa: 1 });
      this.hacerVisitante(p, paso >= 1 ? "esta" : "se va");
    }
  }

  puntoBorde() {
    const a = random(TWO_PI);
    return { x: this.cx + Math.cos(a) * this.zw * 1.1, y: this.cy + Math.sin(a) * this.zh * 1.1 };
  }

  puntoCentral() {
    const [x, y] = puntoEnElipse(this.cx, this.cy, this.zw * 0.32, this.zh * 0.32);
    return { x, y };
  }

  hacerVisitante(p, estado) {
    p.colorObjetivo = this.gris;
    p.d.estado = estado;
    p.d.vida = random(150, 260);
    p.d.destino = estado === "se va" ? this.puntoBorde() : this.puntoCentral();
    this.visitantes.push(p);
  }

  nuevoVisitante() {
    const inicio = this.puntoBorde();
    const tipo = random() < 0.35 ? "experiencia" : "joven"; // su identidad, oculta mientras sea anónima
    const p = this.nodo(tipo, inicio.x, inicio.y, { masa: 1, adoptar: false });
    p.color = this.gris;
    this.hacerVisitante(p, "llega");
  }

  // Seek con llegada (Nature of Code): velocidad deseada hacia el destino.
  dirigir(p, destino, frenar) {
    const dx = destino.x - p.x;
    const dy = destino.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    let v = this.vMax;
    if (frenar && d < 60 * this.esc) v *= d / (60 * this.esc);
    p.vx += ((dx / d) * v - p.vx) * 0.05;
    p.vy += ((dy / d) * v - p.vy) * 0.05;
    return d;
  }

  unirse(p) {
    p.d.estado = "comunidad";
    p.colorObjetivo = colorDeTipo(p.tipo, p); // recupera su identidad
    p.masa = p.tipo === "experiencia" ? 2.5 : 1;
    p.casaX = this.cx;
    p.casaY = this.cy;
    p.rigidezCasa = 0.00003 * p.masa; // cohesión muy suave hacia el centro
    this.comunidad.push(p);
  }

  enlazar(a, b) {
    this.vincular(a, b, 0.06, 0.05, { largo: this.sep, velActivacion: 1 / 20 });
    this.pares.add(`${a.id}-${b.id}`).add(`${b.id}-${a.id}`);
    a.d.lazos = (a.d.lazos || 0) + 1;
    b.d.lazos = (b.d.lazos || 0) + 1;
  }

  formarVinculos() {
    const alcance = (1.2 * this.sep) ** 2;
    for (const v of this.visitantes) {
      if (v.d.estado === "se va" || v.d.estado === "comunidad" || this.comunidad.length >= this.maxComunidad) continue;
      let mejor = null;
      let mejorD = alcance;
      for (const c of this.comunidad) {
        if ((c.d.lazos || 0) >= 4) continue;
        const d = (c.x - v.x) ** 2 + (c.y - v.y) ** 2;
        if (d < mejorD) {
          mejorD = d;
          mejor = c;
        }
      }
      if (!mejor && v.d.estado === "esta") {
        for (const w of this.visitantes) {
          if (w === v || w.d.estado !== "esta") continue;
          const d = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
          if (d < mejorD) {
            mejorD = d;
            mejor = w;
          }
        }
      }
      if (!mejor) continue;
      this.enlazar(v, mejor);
      this.unirse(v);
      if (mejor.d.estado !== "comunidad") this.unirse(mejor);
    }
    this.visitantes = this.visitantes.filter((v) => v.d.estado !== "comunidad");

    // Dentro de la comunidad, los vecinos cercanos también se vinculan entre sí.
    if (this.tiempo % 10 !== 0) return;
    for (const a of this.comunidad) {
      if ((a.d.lazos || 0) >= 3) continue;
      for (const b of this.comunidad) {
        if (a === b || (b.d.lazos || 0) >= 4 || this.pares.has(`${a.id}-${b.id}`)) continue;
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (1.05 * this.sep) ** 2) {
          this.enlazar(a, b);
          break;
        }
      }
    }
  }

  actualizar() {
    const esc = this.esc;
    this.proximo -= 1;
    if (this.proximo <= 0) {
      this.nuevoVisitante();
      this.proximo = 9;
    }

    for (const p of [...this.visitantes]) {
      const estado = p.d.estado;
      if (estado === "llega") {
        if (this.dirigir(p, p.d.destino, true) < 25 * esc) p.d.estado = "esta";
      } else if (estado === "esta") {
        p.vx += randomGaussian() * 0.06 * esc;
        p.vy += randomGaussian() * 0.06 * esc;
        p.d.vida -= 1;
        if (p.d.vida <= 0) {
          p.d.estado = "se va";
          p.d.destino = this.puntoBorde();
        }
      } else if (estado === "se va") {
        if (this.dirigir(p, p.d.destino, false) < 30 * esc) {
          this.quitar(p);
          p.d.estado = "fuera";
        }
      }
    }
    this.visitantes = this.visitantes.filter((p) => p.d.estado !== "fuera");

    if (this.paso >= 1 && this.tiempo % 2 === 0) this.formarVinculos();
    this.espacioPersonal();
    this.mundo.avanzar(2);
  }

  // Repulsión de corto alcance entre miembros de la comunidad: cada persona
  // conserva su espacio, así la comunidad crece hacia afuera en vez de apretarse.
  espacioPersonal() {
    const minimo = 0.85 * this.sep;
    const c = this.comunidad;
    for (let i = 0; i < c.length; i += 1) {
      for (let j = i + 1; j < c.length; j += 1) {
        const dx = c[j].x - c[i].x;
        const dy = c[j].y - c[i].y;
        const d = Math.hypot(dx, dy);
        if (d >= minimo || d < 0.01) continue;
        const f = (minimo - d) * 0.02;
        c[i].vx -= (dx / d) * f;
        c[i].vy -= (dy / d) * f;
        c[j].vx += (dx / d) * f;
        c[j].vy += (dy / d) * f;
      }
    }
  }

  info() {
    return [`de paso: ${this.visitantes.length}`, `se quedaron (comunidad): ${this.comunidad.length}`];
  }
}
