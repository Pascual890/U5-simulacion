// Momento 1 · "Relevo generacional: la ventaja que nadie está aprovechando"
//
// Potencial sin aprovechar. Las dos generaciones comparten el espacio, pero no
// tienen vínculos: son un gas. Los jóvenes (livianos) tienen mucha energía de
// agitación; la experiencia (pesada) se mueve despacio. La energía existe, pero
// sin relaciones no viaja ni construye nada.
// De vez en cuando se forma un vínculo entre una persona joven y una con
// experiencia, pero es débil y se rompe enseguida: oportunidades que se pierden.
//
// Física: movimiento browniano (empujones al azar) dentro de un recipiente
// blando, y resortes que se rompen cuando se estiran demasiado.

class EscenaPotencial extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(1);
    if (ancho >= alto) {
      this.cx = ancho * 0.73;
      this.zw = ancho * 0.22;
      this.zh = alto * 0.38;
    }
    this.mundo.friccion = 0.03;
    this.agitacion = { experiencia: 0.03, joven: 0.15 };
    this.fugaces = [];

    for (let i = 0; i < 40; i += 1) {
      const [x, y] = puntoEnElipse(this.cx, this.cy, this.zw, this.zh);
      this.nodo("experiencia", x, y);
    }
    for (let i = 0; i < 80; i += 1) {
      const [x, y] = puntoEnElipse(this.cx, this.cy, this.zw, this.zh);
      this.nodo("joven", x, y);
    }
  }

  actualizar() {
    const esc = this.esc;
    for (const p of this.mundo.particulas) {
      // Agitación térmica: más fuerte en los jóvenes. Mientras llegan, se agitan menos.
      const agitacion = (this.agitacion[p.tipo] ?? 0.05) * esc * (1 - p.guia);
      p.vx += randomGaussian() * agitacion;
      p.vy += randomGaussian() * agitacion;

      // Recipiente blando: si salen de la elipse, una fuerza los devuelve.
      const dx = (p.x - this.cx) / this.zw;
      const dy = (p.y - this.cy) / this.zh;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        p.vx -= (dx / d) * (d - 1) * 0.5 * esc;
        p.vy -= (dy / d) * (d - 1) * 0.5 * esc;
      }
    }
    this.vinculosFugaces();
    this.mundo.avanzar(2);
  }

  vinculosFugaces() {
    // Los vínculos débiles se rompen si se estiran o con el tiempo.
    for (const r of this.fugaces) {
      r.edad += 1;
      if (r.edad > 110 || r.estiramiento > 0.5) {
        r.roto = true;
        r.a.d.unido = false;
        r.b.d.unido = false;
        this.soltar(r);
      }
    }
    this.fugaces = this.fugaces.filter((r) => !r.roto);

    // Cada tanto, una persona con experiencia y una joven cercanas se vinculan.
    if (this.tiempo < 90 || this.tiempo % 5 !== 0 || this.fugaces.length >= 6) return;
    const libres = this.mundo.particulas.filter((p) => p.tipo === "experiencia" && !p.d.unido);
    if (!libres.length) return;
    const e = random(libres);
    let mejor = null;
    let mejorD = 0.09 * Math.min(this.ancho, this.alto);
    for (const j of this.mundo.particulas) {
      if (j.tipo !== "joven" || j.d.unido) continue;
      const d = Math.hypot(j.x - e.x, j.y - e.y);
      if (d < mejorD) {
        mejorD = d;
        mejor = j;
      }
    }
    if (!mejor) return;
    const r = this.vincular(e, mejor, 0.002, 0.01, { velActivacion: 1 / 12 });
    r.edad = 0;
    e.d.unido = true;
    mejor.d.unido = true;
    this.fugaces.push(r);
  }

  info() {
    return [
      `${this.mundo.particulas.length} personas · ningún vínculo estable`,
      `vínculos que aparecen y se rompen: ${this.fugaces.length}`,
    ];
  }
}
