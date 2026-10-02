// Momentos 9 y 10: las dos generaciones.
//
// Gramática:
//   grupo crema, pesado (masa 3 por nodo)      -> experiencia
//   grupo en colores UPB, liviano (masa 1)     -> nuevas generaciones
//   resorte de cada nodo a su casa             -> el ritmo propio de cada generación
//   misma frecuencia natural                   -> una misma visión
//   brillo de un nodo                          -> cuánto se está moviendo (energía)

// Formación mezclada del momento 10. Define también cuántos nodos tiene cada
// generación: los sitios de clase 0 son de experiencia y los demás de jóvenes.
// Como dos sitios vecinos nunca son de la misma clase, cada persona con
// experiencia queda rodeada de jóvenes: es una mezcla real, no dos bloques pegados.
function disenoGeneraciones(e) {
  const sep = 38 * e.esc;
  const centro = { x: e.cx - 0.02 * e.zw, y: e.cy };
  const sitios = discoHex(85, sep, centro.x, centro.y);
  const base = sitios.slice(0, 61); // hexágono completo de radio 4
  const extra = sitios.slice(61); // anillo 5 (sin esquinas): donde nacen los híbridos
  return {
    sep,
    centro,
    base,
    extra,
    nExp: base.filter((s) => s.clase === 0).length,
    nJov: base.filter((s) => s.clase !== 0).length,
  };
}

class EscenaGeneraciones extends Escena {
  construirGrupos() {
    // En estos momentos el vínculo es el protagonista: más presencia.
    this.alfaResortes = 0.42;
    this.grosorResortes = 1.5;
    randomSeed(9);
    const d = disenoGeneraciones(this);
    this.diseno = d;
    this.w0 = TWO_PI / 156; // un vaivén cada ~2,6 s
    this.centroA = { x: this.cx - 0.52 * this.zw, y: this.cy };
    this.centroB = { x: this.cx + 0.45 * this.zw, y: this.cy };
    const sitiosA = discoHex(d.nExp, 38 * this.esc, this.centroA.x, this.centroA.y, { desorden: 0.08 });
    const sitiosB = discoHex(d.nJov, 31 * this.esc, this.centroB.x, this.centroB.y, { desorden: 0.15 });
    this.experiencia = sitiosA.map((s) => this.nodo("experiencia", s.x, s.y, { masa: 3 }));
    this.jovenes = sitiosB.map((s) => this.nodo("joven", s.x, s.y, { masa: 1 }));
    this.internos = [
      ...vecinosHex(sitiosA).map(([i, j]) => this.vincular(this.experiencia[i], this.experiencia[j], 0.25, 0.05, { desdeCasas: true })),
      ...vecinosHex(sitiosB).map(([i, j]) => this.vincular(this.jovenes[i], this.jovenes[j], 0.25, 0.05, { desdeCasas: true })),
    ];
    this.MA = masaDe(this.experiencia);
    this.MB = masaDe(this.jovenes);
  }

  // Velocidad horizontal promedio (ponderada por masa) de un grupo.
  velocidad(grupo) {
    return grupo.reduce((s, p) => s + p.vx * p.masa, 0) / masaDe(grupo);
  }

  // Desplazamiento horizontal promedio respecto a la casa.
  desplazamiento(grupo) {
    return grupo.reduce((s, p) => s + (p.x - p.casaX) * p.masa, 0) / masaDe(grupo);
  }
}

// Momento 9 · "Una visión. Dos generaciones."
//
// Dos cuerpos separados, sin ningún vínculo entre ellos. Tienen masas muy
// distintas, pero cada uno está afinado a la misma frecuencia (K = M · ω²):
// oscilan en perfecta sincronía. El liviano se mueve más, el pesado menos, y
// los dos llegan a los extremos al mismo tiempo. Comparten la visión (el ritmo)
// sin ser iguales. El vínculo entre ellos llega en el momento siguiente.

class EscenaVision extends EscenaGeneraciones {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    this.construirGrupos();
    const w2 = this.w0 ** 2;
    for (const p of [...this.experiencia, ...this.jovenes]) p.rigidezCasa = p.masa * w2;
    this.iniciado = false;
  }

  actualizar() {
    // Cuando terminan de llegar, los dos empiezan a oscilar en fase.
    if (!this.iniciado && this.tiempo > 125) {
      this.iniciado = true;
      for (const p of this.experiencia) p.vx += 28 * this.esc * this.w0;
      for (const p of this.jovenes) p.vx += 60 * this.esc * this.w0;
    }
    this.mundo.avanzar(4);
  }

  info() {
    const periodo = (TWO_PI / this.w0 / 60).toFixed(1);
    return [`misma frecuencia: un vaivén cada ${periodo} s`, `masa experiencia ${this.MA} · masa jóvenes ${this.MB}`];
  }
}

// Momento 10 · "El crecimiento no ocurre cuando una generación reemplaza a otra.
//              Ocurre cuando trabajan juntas."
//
// Paso 1 · reemplazo. Los mismos dos cuerpos del momento 9, ahora unidos por un
// solo resorte débil. Física de osciladores acoplados: como están afinados a la
// misma frecuencia, la energía pasa por completo de uno al otro y vuelve.
// Cuando uno se mueve el otro se detiene: se turnan, se reemplazan, y la
// energía total nunca crece.
//
// Paso 2 · trabajan juntas. Los vínculos de cada grupo se sueltan y todos se
// reorganizan en una sola formación más grande, intercalada: cada persona con
// experiencia queda rodeada de jóvenes y unida a ellos. Se mueven como un solo
// cuerpo, en fase. Como se mueven en sintonía, cada empujón suma (como empujar
// un columpio al ritmo) y el movimiento crece. En el borde nacen nodos híbridos:
// la formación sigue creciendo.

class EscenaJuntas extends EscenaGeneraciones {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    this.degradados = true;
    this.construirGrupos();
    this.juntas = false;
    this.hibridos = [];
    this.amplitudInicial = 62 * this.esc;

    // --- Afinación de los osciladores acoplados ---
    const cuadrosRelevo = 300; // la energía pasa de un grupo al otro en ~5 s
    const kappa = Math.PI / (2 * cuadrosRelevo);
    this.Kc = kappa * 2 * this.w0 * Math.sqrt(this.MA * this.MB);
    this.KA = this.MA * this.w0 ** 2 - this.Kc;
    this.KB = this.MB * this.w0 ** 2 - this.Kc;
    for (const p of this.experiencia) p.rigidezCasa = this.KA / this.experiencia.length;
    for (const p of this.jovenes) p.rigidezCasa = this.KB / this.jovenes.length;

    // El único vínculo entre las generaciones: entre los nodos más cercanos.
    let par = null;
    let mejor = Infinity;
    for (const a of this.experiencia) {
      for (const b of this.jovenes) {
        const d = (a.casaX - b.casaX) ** 2 + (a.casaY - b.casaY) ** 2;
        if (d < mejor) {
          mejor = d;
          par = [a, b];
        }
      }
    }
    this.acople = this.vincular(par[0], par[1], this.Kc, 0, { desdeCasas: true });

    this.energiaMeta = 1.8 * 0.5 * this.MA * (this.amplitudInicial * this.w0) ** 2;
    this.media = { experiencia: 0, jovenes: 0 };
    this.amplitud = { experiencia: 0, jovenes: 0 };
    // Al llegar desde el momento 11 (hacia atrás), se muestra ya en la formación unida.
    if (paso >= 1) this.mezclar();
  }

  setPaso(paso) {
    this.paso = paso;
    if (paso >= 1 && !this.juntas) this.mezclar();
  }

  // Paso 2: de dos grupos a una sola formación intercalada.
  mezclar() {
    this.juntas = true;
    this.tJuntas = 0;
    this.duracionGuia = 110;
    for (const r of [...this.internos, this.acople]) this.soltar(r);

    const d = this.diseno;
    this.ocupados = new Map();
    this.asignar(this.experiencia, d.base.filter((s) => s.clase === 0));
    this.asignar(this.jovenes, d.base.filter((s) => s.clase !== 0));

    // Todos los nodos con la misma frecuencia: el conjunto oscila como un solo cuerpo.
    const w2 = this.w0 ** 2;
    for (const p of [...this.experiencia, ...this.jovenes]) {
      p.rigidezCasa = p.masa * w2;
      p.guia = 1; // cada persona viaja guiada a su sitio en la formación
      p.edadGuia = 0;
    }

    // El tejido: cada par de sitios vecinos queda unido.
    this.tejido = [];
    for (const [i, j] of vecinosHex(d.base)) {
      const a = this.ocupados.get(`${d.base[i].q},${d.base[i].r}`);
      const b = this.ocupados.get(`${d.base[j].q},${d.base[j].r}`);
      this.tejido.push(this.vincular(a, b, 0.12, 0.05, { largo: d.sep, velActivacion: 1 / 30 }));
    }
  }

  // Asigna sitios a nodos emparejando primero los más cercanos.
  asignar(nodos, sitios) {
    const pares = [];
    for (const p of nodos) for (const s of sitios) pares.push([(p.x - s.x) ** 2 + (p.y - s.y) ** 2, p, s]);
    pares.sort((a, b) => a[0] - b[0]);
    const usados = new Set();
    for (const [, p, s] of pares) {
      if (usados.has(p) || usados.has(s)) continue;
      usados.add(p).add(s);
      p.casaX = s.x;
      p.casaY = s.y;
      p.d.sitio = s;
      this.ocupados.set(`${s.q},${s.r}`, p);
    }
  }

  // El primer paso juntos: un impulso común para todo el conjunto.
  impulsoComun() {
    const v = 0.55 * this.amplitudInicial * this.w0;
    for (const p of this.mundo.particulas) p.vx += v;
  }

  // Un nodo híbrido nace en el borde, unido a todos sus vecinos de la formación.
  nacerHibrido() {
    const s = this.diseno.extra[this.hibridos.length];
    const c = this.estadoConjunto();
    const p = this.nodo("hibrido", s.x, s.y, { masa: 2, rigidezCasa: 2 * this.w0 ** 2, adoptar: false });
    p.x = s.x + c.x;
    p.vx = c.v;
    p.d.sitio = s;
    this.ocupados.set(`${s.q},${s.r}`, p);
    for (const [dq, dr] of DIRECCIONES_HEX) {
      const q = this.ocupados.get(`${s.q + dq},${s.r + dr}`);
      if (q && q !== p) this.vincular(p, q, 0.12, 0.05, { largo: this.diseno.sep, velActivacion: 1 / 30 });
    }
    this.hibridos.push(p);
  }

  // Desplazamiento, velocidad y energía del conjunto, como si fuera una sola masa.
  estadoConjunto() {
    const todos = this.mundo.particulas;
    const M = masaDe(todos);
    let K = 0;
    let x = 0;
    let v = 0;
    for (const p of todos) {
      K += p.rigidezCasa;
      x += (p.x - p.casaX) * p.masa;
      v += p.vx * p.masa;
    }
    x /= M;
    v /= M;
    return { x, v, energia: 0.5 * M * v * v + 0.5 * K * x * x };
  }

  // Impulso compartido: empuja a favor del movimiento solo en la medida en que
  // las dos generaciones se mueven en la misma dirección. Si se turnan (una
  // quieta, la otra en movimiento) la sintonía es cero y no hay crecimiento.
  impulsoCompartido() {
    const vA = this.velocidad(this.experiencia);
    const vB = this.velocidad(this.jovenes);
    const sintonia = Math.max(0, Math.min(1, (vA * vB) / (Math.max(vA * vA, vB * vB) + 1e-9)));
    const c = this.estadoConjunto();
    const ganancia = 0.012 * sintonia * Math.max(0, 1 - c.energia / this.energiaMeta);
    for (const p of this.mundo.particulas) p.vx += ganancia * c.v;
  }

  // Amplitud del vaivén de cada generación, medida alrededor de su posición media.
  seguirAmplitud() {
    for (const [clave, grupo] of [
      ["experiencia", this.experiencia],
      ["jovenes", this.jovenes],
    ]) {
      const x = this.desplazamiento(grupo);
      this.media[clave] += (x - this.media[clave]) * 0.01;
      this.amplitud[clave] = Math.hypot(x - this.media[clave], this.velocidad(grupo) / this.w0);
    }
  }

  actualizar() {
    if (!this.juntas && this.tiempo === 125) {
      // Arranca moviéndose la experiencia; las nuevas generaciones están quietas.
      for (const p of this.experiencia) p.vx += this.amplitudInicial * this.w0;
    }
    if (this.juntas) {
      this.tJuntas += 1;
      if (this.tJuntas === 140) this.impulsoComun();
      if (this.tJuntas > 150 && this.tJuntas % 14 === 0 && this.hibridos.length < this.diseno.extra.length) this.nacerHibrido();
      if (this.tJuntas > 140) this.impulsoCompartido();
    }
    this.mundo.avanzar(4);
    this.seguirAmplitud();
  }

  info() {
    const referencia = this.amplitudInicial * 1.5;
    const barra = (a) => "█".repeat(Math.min(12, Math.round((a / referencia) * 12))).padEnd(12, "·");
    return [
      this.juntas
        ? `trabajan juntas · formación de ${this.mundo.particulas.length} nodos · ${this.hibridos.length} híbridos`
        : "reemplazo · 1 vínculo débil",
      `movimiento experiencia ${barra(this.amplitud.experiencia)}`,
      `movimiento jóvenes     ${barra(this.amplitud.jovenes)}`,
    ];
  }
}
