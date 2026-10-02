// Momento 3 · "Los eventos no llegaron a la Universidad.
//              La Universidad decidió encontrarse con el mundo."
//
// Apertura y encuentro.
// Paso 1: la Universidad es un cuerpo cerrado y cohesionado (las dos
// generaciones adentro). El mundo (gris) circula alrededor, a distancia: pasa
// de largo y nunca entra. Los eventos no llegaron solos.
// Paso 2: la Universidad decide salir. Extiende brazos (cadenas de sus propios
// nodos) que buscan a personas del mundo; el mundo también se acerca. Al
// tocarse se vinculan, y esas personas atraen a otras: se forma una red que
// conecta la Universidad con el mundo. Los brazos quedan en tensión.
//
// Física: resortes, una fuerza de búsqueda en la punta de cada brazo (la
// intención de encontrarse) y vínculos que se forman por cercanía.

class EscenaEncuentro extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(3);
    this.mundo.friccion = 0.02;
    this.sep = 28 * this.esc;
    this.ux = this.cx - 0.05 * this.zw;
    this.uy = this.cy;

    // La Universidad.
    const sitios = discoHex(37, this.sep, this.ux, this.uy, { desorden: 0.08 });
    this.universidad = sitios.map((s) => {
      const tipo = random() < 0.4 ? "experiencia" : "joven";
      return this.nodo(tipo, s.x, s.y, { rigidezCasa: 0.012 * MASA_TIPO[tipo] });
    });
    for (const [i, j] of vecinosHex(sitios)) {
      this.vincular(this.universidad[i], this.universidad[j], 0.15, 0.04, { desdeCasas: true });
    }

    // El mundo: personas que circulan alrededor, sin entrar.
    this.exterior = [];
    for (let i = 0; i < 56; i += 1) {
      const angulo = random(TWO_PI);
      const radio = random(0.62, 0.98);
      const [x, y] = this.puntoOrbita(angulo, radio);
      const p = this.nodo("mundo", x, y, { rigidezCasa: 0.004 });
      Object.assign(p.d, { angulo, radio, velocidad: random(0.0016, 0.003) });
      this.exterior.push(p);
    }

    this.brazos = [];
    this.pares = new Set();
    if (paso >= 1) this.abrir();
  }

  puntoOrbita(angulo, radio) {
    return [this.ux + Math.cos(angulo) * radio * this.zw * 0.95, this.uy + Math.sin(angulo) * radio * this.zh * 0.95];
  }

  setPaso(paso) {
    this.paso = paso;
    if (paso >= 1 && !this.brazos.length) this.abrir();
  }

  // La Universidad elige hacia dónde salir: cinco personas del mundo, repartidas alrededor.
  abrir() {
    const elegidos = new Set();
    for (let k = 0; k < 5; k += 1) {
      const angulo = -Math.PI / 2 + (k * TWO_PI) / 5 + random(-0.3, 0.3);
      let objetivo = null;
      let mejor = Infinity;
      for (const p of this.exterior) {
        if (elegidos.has(p)) continue;
        const diferencia = Math.abs(Math.atan2(Math.sin(p.d.angulo - angulo), Math.cos(p.d.angulo - angulo)));
        if (diferencia < mejor) {
          mejor = diferencia;
          objetivo = p;
        }
      }
      elegidos.add(objetivo);
      const dx = objetivo.x - this.ux;
      const dy = objetivo.y - this.uy;
      const raiz = this.universidad.reduce((m, p) => ((p.x - this.ux) * dx + (p.y - this.uy) * dy > (m.x - this.ux) * dx + (m.y - this.uy) * dy ? p : m));
      this.brazos.push({ punta: raiz, previo: null, objetivo, nodos: [], conectado: false, reloj: k * 3 });
    }
  }

  crecerBrazos() {
    const seg = this.sep * 0.95;
    for (const b of this.brazos) {
      if (b.conectado) continue;
      b.reloj += 1;
      const o = b.objetivo;
      const t = b.punta;
      const dx = o.x - t.x;
      const dy = o.y - t.y;
      const d = Math.hypot(dx, dy) || 1;

      // Se tocan: queda un vínculo entre la Universidad y el mundo.
      if (d < 1.2 * seg && b.nodos.length) {
        this.vincular(t, o, 0.06, 0.03, { largo: seg, velActivacion: 1 / 15 });
        this.conectarMundo(o);
        b.conectado = true;
        continue;
      }

      // El brazo crece un nodo hacia su objetivo.
      if (b.reloj % 7 === 0 && b.nodos.length < 16) {
        const tipo = random() < 0.4 ? "experiencia" : "joven";
        const p = this.nodo(tipo, t.x + (dx / d) * seg, t.y + (dy / d) * seg, { masa: 1, adoptar: false });
        p.alfa = 0.4;
        p.vx = t.vx;
        p.vy = t.vy;
        this.vincular(t, p, 0.08, 0.03, { largo: seg, velActivacion: 1 / 10 });
        if (b.previo) this.vincular(b.previo, p, 0.03, 0.02, { largo: seg * 1.95, velActivacion: 1 / 10 });
        b.previo = t;
        b.punta = p;
        b.nodos.push(p);
      }

      // Intención de encontrarse: la punta busca a la persona y ella se acerca.
      if (b.nodos.length) {
        b.punta.vx += (dx / d) * 0.05 * this.esc;
        b.punta.vy += (dy / d) * 0.05 * this.esc;
      }
      o.vx -= (dx / d) * 0.03 * this.esc;
      o.vy -= (dy / d) * 0.03 * this.esc;
    }
  }

  conectarMundo(p) {
    p.d.conectado = true;
    p.rigidezCasa = 0;
    p.colorObjetivo = mezclar(CONFIG.paleta.mundo, CONFIG.paleta.experiencia, 0.55);
  }

  // Las personas del mundo ya conectadas atraen a otras que pasan cerca.
  propagarEncuentro() {
    const alcance = (1.9 * this.sep) ** 2;
    for (const o of this.exterior) {
      if (!o.d.conectado || (o.d.lazos || 0) >= 3) continue;
      let mejor = null;
      let mejorD = alcance;
      for (const f of this.exterior) {
        if (f === o || this.pares.has(`${o.id}-${f.id}`)) continue;
        const d = (f.x - o.x) ** 2 + (f.y - o.y) ** 2;
        if (d < mejorD) {
          mejorD = d;
          mejor = f;
        }
      }
      if (!mejor || random() > 0.15) continue;
      this.vincular(o, mejor, 0.04, 0.03, { velActivacion: 1 / 15 });
      this.pares.add(`${o.id}-${mejor.id}`).add(`${mejor.id}-${o.id}`);
      o.d.lazos = (o.d.lazos || 0) + 1;
      mejor.d.lazos = (mejor.d.lazos || 0) + 1;
      if (!mejor.d.conectado) this.conectarMundo(mejor);
    }
  }

  actualizar() {
    const esc = this.esc;
    for (const p of this.exterior) {
      if (p.d.conectado) continue;
      p.d.angulo += p.d.velocidad;
      [p.casaX, p.casaY] = this.puntoOrbita(p.d.angulo, p.d.radio);
      p.vx += randomGaussian() * 0.02 * esc;
      p.vy += randomGaussian() * 0.02 * esc;
    }
    if (this.brazos.length) {
      this.crecerBrazos();
      if (this.tiempo % 4 === 0) this.propagarEncuentro();
    }
    this.mundo.avanzar(3);
  }

  info() {
    if (!this.brazos.length) return ["la Universidad está cerrada", "el mundo pasa alrededor: 0 vínculos"];
    const puentes = this.brazos.filter((b) => b.conectado).length;
    const conectados = this.exterior.filter((p) => p.d.conectado).length;
    return [`puentes con el mundo: ${puentes} / ${this.brazos.length}`, `personas del mundo conectadas: ${conectados}`];
  }
}
