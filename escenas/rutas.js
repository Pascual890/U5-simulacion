// Momento 8 · "La experiencia construye el camino.
//              Las nuevas generaciones descubren nuevas rutas."
//
// Paso 1: la experiencia construye el camino. Las personas con experiencia
// salen de la multitud una por una y se colocan en una curva que avanza hacia
// la derecha (hacia adelante). Es una cadena pesada, rígida y bien anclada:
// una base estable.
// Paso 2: desde puntos del camino brotan rutas de jóvenes. Cada ruta crece
// explorando (su dirección cambia con ruido de Perlin), a veces se bifurca, y
// cuando toca otra ruta se conecta con ella. Las rutas son livianas y flexibles,
// pero nacen del camino: sin la base no hay desde dónde explorar. Los pulsos que
// recorren el camino también entran a las rutas.
//
// Física: cadenas de resortes (con resortes de flexión), anclas, y crecimiento
// con dirección errante (wander) y ruido de Perlin.

class EscenaRutas extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(8);
    noiseSeed(8);
    this.mundo.friccion = 0.03;
    this.alfaResortes = 0.34; // las rutas se dibujan sobre una foto: más presencia
    this.escalaNodos = 1.2;
    this.n = 15;
    this.sep = (1.7 * this.zw) / (this.n - 1);
    this.seg = this.sep * 0.8;

    // El trazado del camino: una curva suave que sube hacia la derecha.
    this.trazado = [];
    for (let i = 0; i < this.n; i += 1) {
      const t = i / (this.n - 1);
      this.trazado.push({
        x: this.cx - 0.85 * this.zw + t * 1.7 * this.zw,
        y: this.cy + 0.42 * this.zh - t * 0.65 * this.zh + Math.sin(t * Math.PI * 1.3) * 0.16 * this.zh,
      });
    }

    // Quienes esperan: personas del momento anterior que se quedan donde están.
    const heredados = barajar(this.disponibles);
    this.reservaExp = heredados
      .filter((q) => q.tipo === "experiencia")
      .slice(0, this.n)
      .map((q) => this.adoptarDirecto(q, { rigidezCasa: 0.003 * MASA_TIPO.experiencia }));
    this.reservaJov = heredados
      .filter((q) => q.tipo === "joven")
      .slice(0, 70)
      .map((q) => this.adoptarDirecto(q, { rigidezCasa: 0.003 }));

    this.camino = [];
    this.ramas = [];
    this.nodosRuta = [];
    this.pares = new Set();
    this.proximoPulso = 0;

    if (paso >= 1) {
      while (this.camino.length < this.n) this.colocarCamino();
      this.empezarRamas();
    }
  }

  tomar(reserva, tipo, x, y, opciones) {
    if (reserva.length) {
      const p = this.reclutar(reserva, x, y);
      p.masa = opciones.masa;
      p.rigidezCasa = opciones.rigidezCasa;
      return p;
    }
    return this.nodo(tipo, x, y, { ...opciones, adoptar: false });
  }

  colocarCamino() {
    const i = this.camino.length;
    const { x, y } = this.trazado[i];
    const p = this.tomar(this.reservaExp, "experiencia", x, y, { masa: 3, rigidezCasa: 0.09 });
    p.d.camino = true;
    if (i > 0) this.vincular(this.camino[i - 1], p, 0.25, 0.06, { desdeCasas: true });
    if (i > 1) this.vincular(this.camino[i - 2], p, 0.1, 0.04, { desdeCasas: true });
    this.camino.push(p);
    if (this.camino.length === this.n) this.tCaminoCompleto = this.tiempo;
  }

  setPaso(paso) {
    this.paso = paso;
    if (paso >= 1 && !this.ramas.length) {
      while (this.camino.length < this.n) this.colocarCamino();
      this.empezarRamas();
    }
  }

  // Seis rutas brotan del camino, alternando hacia arriba y hacia abajo.
  empezarRamas() {
    [3, 5, 7, 9, 11, 13].forEach((i, k) => {
      const lado = k % 2 === 0 ? -1 : 1;
      const a = this.trazado[i - 1];
      const b = this.trazado[i + 1];
      const tx = b.x - a.x;
      const ty = b.y - a.y;
      const t = Math.hypot(tx, ty);
      const nx = (-ty / t) * lado;
      const ny = (tx / t) * lado;
      this.ramas.push({
        punta: this.camino[i],
        previo: this.camino[i - 1],
        rumbo: Math.atan2(ny * 0.85 + (ty / t) * 0.5, nx * 0.85 + (tx / t) * 0.5),
        largo: 0,
        max: Math.floor(random(6, 11)),
        viva: true,
        reloj: k * 6,
        semilla: random(1000),
      });
    });
  }

  crecerRamas() {
    for (const b of [...this.ramas]) {
      if (!b.viva) continue;
      b.reloj += 1;
      if (b.reloj % 9 !== 0) continue;

      // Dirección errante: la ruta explora.
      b.rumbo += (noise(b.semilla, this.tiempo * 0.01) - 0.5) * 0.9;
      let x = b.punta.casaX + Math.cos(b.rumbo) * this.seg;
      let y = b.punta.casaY + Math.sin(b.rumbo) * this.seg;
      // Si se sale de la zona, gira hacia el centro.
      if (((x - this.cx) / this.zw) ** 2 + ((y - this.cy) / this.zh) ** 2 > 1) {
        const haciaCentro = Math.atan2(this.cy - b.punta.casaY, this.cx - b.punta.casaX);
        b.rumbo += Math.atan2(Math.sin(haciaCentro - b.rumbo), Math.cos(haciaCentro - b.rumbo)) * 0.6;
        x = b.punta.casaX + Math.cos(b.rumbo) * this.seg;
        y = b.punta.casaY + Math.sin(b.rumbo) * this.seg;
      }

      const p = this.tomar(this.reservaJov, "joven", x, y, { masa: 1, rigidezCasa: 0.004 });
      this.vincular(b.punta, p, 0.06, 0.03, { largo: this.seg, velActivacion: 1 / 15 });
      if (b.previo) this.vincular(b.previo, p, 0.02, 0.02, { desdeCasas: true, velActivacion: 1 / 15 });
      b.punta.d.punta = false;
      p.d.punta = true;
      p.d.rama = b;
      b.previo = b.punta;
      b.punta = p;
      b.largo += 1;
      this.nodosRuta.push(p);

      // A veces la ruta se bifurca.
      if (random() < 0.13 && this.ramas.length < 16) {
        this.ramas.push({
          punta: p,
          previo: b.previo,
          rumbo: b.rumbo + (random() < 0.5 ? -0.75 : 0.75),
          largo: 0,
          max: Math.floor(random(4, 7)),
          viva: true,
          reloj: 0,
          semilla: random(1000),
        });
      }

      // Si toca otra ruta, se conecta con ella y deja de crecer.
      const otra = this.nodosRuta.find(
        (q) => q.d.rama !== b && q !== b.previo && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < (0.9 * this.seg) ** 2,
      );
      if (otra && b.largo > 2) {
        this.vincular(p, otra, 0.04, 0.03, { velActivacion: 1 / 15 });
        b.viva = false;
        p.d.punta = false;
      }
      if (b.largo >= b.max) {
        b.viva = false;
        p.d.punta = false;
      }
    }
  }

  actualizar() {
    // Paso 1: la experiencia coloca el camino, una persona cada 11 cuadros.
    if (this.paso < 1 && this.camino.length < this.n && this.tiempo > 30 && this.tiempo % 11 === 0) this.colocarCamino();

    // La experiencia que sobra se va cuando el camino está listo.
    if (this.tCaminoCompleto !== undefined && this.tiempo === this.tCaminoCompleto + 60) {
      for (const p of this.reservaExp) this.quitar(p);
      this.reservaExp = [];
    }

    if (this.ramas.length) {
      this.crecerRamas();
      // Cuando ninguna ruta sigue creciendo, los jóvenes que esperaban se van.
      if (this.reservaJov.length && !this.ramas.some((b) => b.viva)) {
        for (const p of this.reservaJov) this.quitar(p);
        this.reservaJov = [];
      }
    }

    // Un pulso recorre el camino: lo que la experiencia construyó transmite energía.
    if (this.camino.length === this.n && this.tiempo >= this.proximoPulso) {
      const a = this.camino[0];
      const b = this.camino[1];
      const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      a.vx += ((b.x - a.x) / d) * 2.5 * this.esc;
      a.vy += ((b.y - a.y) / d) * 2.5 * this.esc;
      this.proximoPulso = this.tiempo + 200;
    }

    this.mundo.avanzar(4);
    for (const p of this.nodosRuta) if (p.d.punta) p.brillo = Math.max(p.brillo, 0.9);
  }

  info() {
    return [`camino: ${this.camino.length} / ${this.n} nodos de experiencia`, `rutas: ${this.ramas.length} · nodos jóvenes: ${this.nodosRuta.length}`];
  }
}
