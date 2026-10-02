// Momento 11 · "Los jóvenes no son el futuro.
//              Son el presente que muchas organizaciones aún no ven."
//
// Ya están adentro. La organización es una formación de las dos generaciones
// (la misma gente del momento 10): las personas con experiencia forman un panal
// de hexágonos y en el centro de cada celda hay una persona joven, unida a las
// seis que la rodean. Pulsos de energía (talento, trabajo, ideas) recorren la
// organización todo el tiempo, y cada pulso nace en una persona joven.
//
// Paso 1: solo se ven la experiencia y sus vínculos. La organización parece un
// panal completo y está viva: se mueve y se enciende, pero no se ve de dónde
// viene la energía. Cada celda vacía se ilumina desde adentro.
// Paso 2: aparecen los jóvenes en el centro de cada celda, con sus vínculos, y
// se ve que cada pulso nace en uno de ellos. Siempre estuvieron ahí: la
// organización estaba completa y era su energía la que la movía.
// La física es idéntica en los dos pasos: lo único que cambia es lo que se ve.
//
// Física: red de resortes. Cada pulso es un empujón que una persona joven da a
// sus vecinos, y viaja por los vínculos como una onda.

class EscenaPresente extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(11);
    this.brilloPropio = true;
    this.degradados = true;
    this.alfaResortes = 0.36;
    this.mundo.friccion = 0.03;
    this.sep = 40 * this.esc;
    this.minimoVisible = 0.03; // los jóvenes en el paso 1: casi invisibles
    this.visible = paso >= 1 ? 1 : this.minimoVisible;
    this.intervaloPulso = 28; // un pulso cada ~0,5 s, cada vez desde una persona joven distinta
    this.proximoPulso = 90;
    this.pulsos = 0;
    this.destellos = [];

    // En la retícula hexagonal, los sitios de clase 0 nunca son vecinos entre sí:
    // ahí van los jóvenes. Los demás sitios (experiencia) forman un panal.
    // En el borde, una persona con experiencia unida a menos de dos de su
    // generación quedaría colgando del panal: esos sitios se quitan.
    const todos = discoHex(91, this.sep, this.cx, this.cy);
    const claves = new Set(todos.map((s) => `${s.q},${s.r}`));
    const clase = (q, r) => (((q - r) % 3) + 3) % 3;
    const sitios = todos.filter(
      (s) =>
        s.clase === 0 ||
        DIRECCIONES_HEX.filter(([dq, dr]) => claves.has(`${s.q + dq},${s.r + dr}`) && clase(s.q + dq, s.r + dr) !== 0).length >= 2,
    );
    const ocupados = new Map();
    this.jovenes = [];
    for (const s of sitios) {
      const tipo = s.clase === 0 ? "joven" : "experiencia";
      const p = this.nodo(tipo, s.x, s.y, { masa: tipo === "joven" ? 1 : 2, rigidezCasa: 0.003 });
      p.d.vecinos = [];
      ocupados.set(`${s.q},${s.r}`, p);
      if (tipo === "joven") this.jovenes.push(p);
    }
    for (const [i, j] of vecinosHex(sitios)) {
      const a = ocupados.get(`${sitios[i].q},${sitios[i].r}`);
      const b = ocupados.get(`${sitios[j].q},${sitios[j].r}`);
      this.vincular(a, b, 0.12, 0.03, { desdeCasas: true });
      a.d.vecinos.push(b);
      b.d.vecinos.push(a);
    }
    for (const p of this.jovenes) p.d.visibilidad = this.visible;
    this.porPulsar = barajar(this.jovenes);
  }

  // Una persona joven empuja a sus vecinos hacia afuera: de ahí nace la onda.
  pulso() {
    if (!this.porPulsar.length) this.porPulsar = barajar(this.jovenes);
    const p = this.porPulsar.pop();
    for (const q of p.d.vecinos) {
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      q.vx += (dx / d) * 2.3 * this.esc;
      q.vy += (dy / d) * 2.3 * this.esc;
    }
    this.destellos.push({ p, intensidad: 1 });
    this.pulsos += 1;
  }

  actualizar() {
    // Los jóvenes se revelan poco a poco en el paso 2.
    const objetivo = this.paso >= 1 ? 1 : this.minimoVisible;
    this.visible += (objetivo - this.visible) * 0.035;
    for (const p of this.jovenes) p.d.visibilidad = this.visible;

    if (this.tiempo >= this.proximoPulso) {
      this.pulso();
      this.proximoPulso += this.intervaloPulso;
    }

    this.mundo.avanzar(3);

    // Brillo = energía de movimiento. Mientras una persona viaja a su lugar no
    // brilla: ese movimiento no le llegó por un vínculo.
    for (const p of this.mundo.particulas) {
      p.brillo = p.guia > 0 ? 0 : escalaLog(p.rapidez() / this.esc, 0.03, 1.2);
    }
    for (const d of this.destellos) d.intensidad *= 0.9;
    this.destellos = this.destellos.filter((d) => d.intensidad > 0.03);
  }

  dibujar(ctx) {
    super.dibujar(ctx);
    // El destello donde nace cada pulso: tan visible como la persona joven que lo da.
    for (const d of this.destellos) {
      this.dibujarDestello(ctx, d.p.x, d.p.y, d.intensidad * this.visible);
    }
  }

  info() {
    return [
      `jóvenes visibles: ${Math.round(this.visible * 100)} %`,
      `pulsos: ${this.pulsos} · todos nacen en una persona joven`,
    ];
  }
}
