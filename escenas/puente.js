// Momentos 12 y 13: el puente.
//
// El futuro como un puente entre la experiencia (orilla izquierda) y las
// nuevas generaciones (orilla derecha). Con gravedad, una estructura solo se
// sostiene si sus relaciones la sostienen.

// Geometría del puente: una cercha (dos cuerdas unidas por montantes y
// diagonales) con un arco suave. Las columnas 0 y la última son las orillas.
function disenoPuente(e) {
  const paneles = 12;
  const xI = e.cx - 0.92 * e.zw;
  const xD = e.cx + 0.92 * e.zw;
  const ancho = (xD - xI) / paneles;
  const alto = 0.8 * ancho;
  const base = e.cy + 0.2 * e.zh;
  const arco = 0.2 * e.zh;
  const sup = [];
  const inf = [];
  for (let i = 0; i <= paneles; i += 1) {
    const elevacion = arco * Math.sin((Math.PI * i) / paneles);
    inf.push({ x: xI + i * ancho, y: base - elevacion });
    sup.push({ x: xI + i * ancho, y: base - elevacion - alto });
  }
  return { paneles, sup, inf, ancho, alto, base, xI, xD };
}

// La mitad izquierda la construye la experiencia, la derecha las nuevas
// generaciones, y la columna central nace de la unión.
function tipoColumna(i, paneles) {
  if (i < paneles / 2) return "experiencia";
  if (i > paneles / 2) return "joven";
  return "hibrido";
}

const MASA_PUENTE = { experiencia: 2, joven: 1, hibrido: 1.5 };

class EscenaPuente extends Escena {
  iniciarPuente() {
    this.diseno = disenoPuente(this);
    this.columnas = [];
    this.degradados = true;
    this.mundo.friccion = 0.025;
    this.mundo.gravedad.y = 0.035 * this.esc;
    this.k = { cuerda: 1, montante: 0.8, diagonal: 0.8, amortiguacion: 0.15 };
    // Guía más rápida: los constructores llegan a su lugar en ~1 s.
    this.mundo.kGuia = 0.008;
    this.mundo.cGuia = 2 * Math.sqrt(this.mundo.kGuia);
  }

  // Las dos personas de la columna i (de una reserva, de la herencia o nuevas).
  crearColumna(i, { reserva = null, adoptar = true } = {}) {
    const d = this.diseno;
    const tipo = tipoColumna(i, d.paneles);
    const orilla = i === 0 || i === d.paneles;
    const col = { i };
    for (const cuerda of ["sup", "inf"]) {
      const pos = d[cuerda][i];
      const p = reserva && reserva.length ? this.reclutar(reserva, pos.x, pos.y) : this.nodo(tipo, pos.x, pos.y, { adoptar });
      p.masa = MASA_PUENTE[tipo];
      p.rigidezCasa = 0;
      p.escalaGravedad = 1;
      if (orilla) this.fijarAlLlegar(p);
      col[cuerda] = p;
    }
    this.columnas[i] = col;
    return col;
  }

  // Une la columna i con sus vecinas ya construidas: triángulos, que no se deforman.
  // Los largos de reposo son los del diseño.
  vincularColumna(i, velActivacion = 1 / 25) {
    const d = this.diseno;
    const { k } = this;
    const c = k.amortiguacion;
    const col = this.columnas[i];
    const largo = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    if (i > 0 && i < d.paneles) this.vincular(col.sup, col.inf, k.montante, c, { largo: largo(d.sup[i], d.inf[i]), velActivacion });
    for (const j of [i - 1, i + 1]) {
      const otra = this.columnas[j];
      if (!otra || !otra.vinculada) continue;
      const [izq, der] = j < i ? [j, i] : [i, j];
      const ci = this.columnas[izq];
      const cd = this.columnas[der];
      this.vincular(ci.sup, cd.sup, k.cuerda, c, { largo: largo(d.sup[izq], d.sup[der]), velActivacion });
      this.vincular(ci.inf, cd.inf, k.cuerda, c, { largo: largo(d.inf[izq], d.inf[der]), velActivacion });
      // Diagonales que suben hacia el centro.
      if (der <= d.paneles / 2) this.vincular(ci.inf, cd.sup, k.diagonal, c, { largo: largo(d.inf[izq], d.sup[der]), velActivacion });
      else this.vincular(ci.sup, cd.inf, k.diagonal, c, { largo: largo(d.sup[izq], d.inf[der]), velActivacion });
    }
    col.vinculada = true;
  }

  construirCompleto() {
    for (let i = 0; i <= this.diseno.paneles; i += 1) {
      this.crearColumna(i);
      this.vincularColumna(i);
    }
  }

  // Un empujón hacia abajo en el centro del puente.
  empujarCentro(fuerza) {
    const mitad = this.diseno.paneles / 2;
    for (const i of [mitad - 1, mitad, mitad + 1]) {
      const col = this.columnas[i];
      if (!col) continue;
      col.sup.vy += fuerza * this.esc;
      col.inf.vy += fuerza * this.esc;
    }
  }

  // Cuánto se hunde el centro respecto al diseño (para la vista de depuración).
  hundimiento() {
    const mitad = this.diseno.paneles / 2;
    const col = this.columnas[mitad];
    return col ? col.inf.y - this.diseno.inf[mitad].y : 0;
  }
}

// Momento 12 · "El futuro no se hereda. / Se construye."
//
// Paso 1: aparece un puente completo, pero heredado: los puntos están en su
// lugar, colgados de hilos externos (el pasado), y no tienen vínculos propios.
// Los hilos se sueltan y la forma se desmorona: tener la forma no basta.
// Paso 2: la experiencia construye desde la orilla izquierda y los jóvenes
// desde la derecha, columna por columna, con triángulos. Cada columna nueva se
// coloca siguiendo la orientación real del tramo anterior, y se vincula cuando
// llega. Mientras están separados, cada lado es un voladizo que se dobla con su
// propio peso. Cuando se encuentran, nace en la unión la columna central
// (híbrida): el puente, ahora apoyado en las dos orillas, se levanta y queda en
// equilibrio. Al final llega un empujón: el puente construido tiembla, pero se
// sostiene.

class EscenaFuturo extends EscenaPuente {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(12);
    this.iniciarPuente();
    this.heredado = [];
    this.enCamino = [];
    this.construyendo = false;
    this.unido = false;
    const d = this.diseno;

    if (paso >= 1) {
      // Al llegar desde el cierre (hacia atrás), el puente ya está construido.
      this.duracionGuia = 35;
      this.construirCompleto();
      this.construyendo = true;
      this.unido = true;
      this.tC = 0;
      this.tUnion = -1000;
      return;
    }

    // La guía de cada constructor se suelta cuando llega y se vincula (no por tiempo).
    this.duracionGuia = Infinity;

    // Las orillas.
    this.crearColumna(0);
    this.vincularColumna(0);
    this.crearColumna(d.paneles);
    this.vincularColumna(d.paneles);

    // Quienes van a construir esperan junto a cada orilla.
    this.reservaI = this.formarReserva("experiencia", d.xI + 0.12 * this.zw, d.base + 0.55 * this.zh);
    this.reservaD = this.formarReserva("joven", d.xD - 0.12 * this.zw, d.base + 0.55 * this.zh);

    // El puente heredado: la forma completa, sin vínculos, colgada de hilos.
    const gris = mezclar(CONFIG.paleta.experiencia, CONFIG.paleta.mundo, 0.6);
    for (let i = 1; i < d.paneles; i += 1) {
      for (const cuerda of ["sup", "inf"]) {
        const pos = d[cuerda][i];
        const p = this.nodo("hibrido", pos.x, pos.y, { adoptar: false });
        p.fija = true;
        p.color = gris;
        p.colorObjetivo = gris;
        this.heredado.push(p);
      }
    }
    this.ordenSoltar = [...this.heredado].sort((a, b) => Math.abs(a.x - this.cx) - Math.abs(b.x - this.cx));
    this.tSoltar = 110;
  }

  formarReserva(tipo, x, y) {
    const sitios = discoHex(10, 24 * this.esc, x, y, { desorden: 0.2 });
    return sitios.map((s) => {
      const p = this.nodo(tipo, s.x, s.y, { masa: MASA_PUENTE[tipo], rigidezCasa: 0.01 * MASA_PUENTE[tipo] });
      p.escalaGravedad = 0;
      return p;
    });
  }

  setPaso(paso) {
    this.paso = paso;
    if (paso >= 1 && !this.construyendo) {
      this.construyendo = true;
      this.tC = 0;
      this.ultimaIzq = 0;
      this.ultimaDer = this.diseno.paneles;
      for (const p of this.heredado) this.soltarHilo(p);
    }
  }

  soltarHilo(p) {
    if (!p.fija) return;
    p.fija = false;
    p.escalaGravedad = 3;
  }

  // Dónde va la columna i si se construye a partir de la columna ref: la misma forma
  // relativa del diseño, pero girada y trasladada según la posición real de ref.
  objetivoDesde(i, ref) {
    const d = this.diseno;
    const real = this.columnas[ref];
    const angulo =
      Math.atan2(real.sup.y - real.inf.y, real.sup.x - real.inf.x) -
      Math.atan2(d.sup[ref].y - d.inf[ref].y, d.sup[ref].x - d.inf[ref].x);
    const cos = Math.cos(angulo);
    const sin = Math.sin(angulo);
    const transformar = (p) => {
      const dx = p.x - d.inf[ref].x;
      const dy = p.y - d.inf[ref].y;
      return { x: real.inf.x + dx * cos - dy * sin, y: real.inf.y + dx * sin + dy * cos };
    };
    return { sup: transformar(d.sup[i]), inf: transformar(d.inf[i]) };
  }

  objetivoColumna(i) {
    const mitad = this.diseno.paneles / 2;
    if (i < mitad) return this.objetivoDesde(i, i - 1);
    if (i > mitad) return this.objetivoDesde(i, i + 1);
    // La columna central queda entre las dos puntas.
    const a = this.objetivoDesde(i, i - 1);
    const b = this.objetivoDesde(i, i + 1);
    const medio = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
    return { sup: medio(a.sup, b.sup), inf: medio(a.inf, b.inf) };
  }

  // Lanza una columna: sus dos personas vuelan hacia su lugar.
  lanzarColumna(i, reserva) {
    const col = this.crearColumna(i, { reserva, adoptar: false });
    for (const p of [col.sup, col.inf]) {
      p.guia = 1;
      p.edadGuia = 0;
      p.escalaGravedad = 0; // mientras vuela lo llevan; el peso cuenta cuando se vincula
    }
    this.enCamino.push({ col, t0: this.tC });
  }

  construir() {
    this.tC += 1;

    // Columnas en camino: su destino sigue al voladizo real; al llegar, se vinculan.
    for (const c of this.enCamino) {
      const { col } = c;
      const obj = this.objetivoColumna(col.i);
      for (const cuerda of ["sup", "inf"]) {
        col[cuerda].casaX = obj[cuerda].x;
        col[cuerda].casaY = obj[cuerda].y;
      }
      // Solo se vincula cuando la columna de la que se construye ya está firme.
      const mitad = this.diseno.paneles / 2;
      const referencias = col.i < mitad ? [col.i - 1] : col.i > mitad ? [col.i + 1] : [col.i - 1, col.i + 1];
      const vecinasListas = referencias.every((j) => this.columnas[j] && this.columnas[j].vinculada);
      const llego = ["sup", "inf"].every((k) => Math.hypot(col[k].x - obj[k].x, col[k].y - obj[k].y) < 8 * this.esc);
      if (vecinasListas && (llego || this.tC - c.t0 > 160)) {
        this.vincularColumna(col.i, 1 / 10);
        for (const p of [col.sup, col.inf]) {
          p.d.soltando = true;
          p.escalaGravedad = 1;
        }
        c.listo = true;
      }
    }
    this.enCamino = this.enCamino.filter((c) => !c.listo);
    for (const p of this.mundo.particulas) if (p.d.soltando && p.guia > 0) p.guia = Math.max(0, p.guia - 0.03);

    if (this.unido) {
      if (this.tC === this.tUnion + 260) this.empujarCentro(1.6); // la prueba
      return;
    }
    if (this.tC % 45 !== 0) return;
    const izq = this.ultimaIzq + 1;
    const der = this.ultimaDer - 1;
    if (izq < der) {
      this.lanzarColumna(izq, this.reservaI);
      this.lanzarColumna(der, this.reservaD);
      this.ultimaIzq = izq;
      this.ultimaDer = der;
    } else if (izq === der) {
      // Los dos lados se encuentran: la columna central nace de la unión.
      this.lanzarColumna(izq, null);
      this.unido = true;
      this.tUnion = this.tC;
      for (const p of [...this.reservaI, ...this.reservaD]) this.quitar(p);
      this.reservaI = [];
      this.reservaD = [];
    }
  }

  actualizar() {
    // El puente heredado se suelta desde el centro hacia las orillas, y cae.
    if (this.heredado.length) {
      const t = this.tiempo - this.tSoltar;
      if (t >= 0 && t % 2 === 0 && t / 2 < this.ordenSoltar.length) this.soltarHilo(this.ordenSoltar[t / 2]);
      for (const p of this.heredado) if (!p.fija && p.y > this.diseno.base + 0.7 * this.zh) this.quitar(p);
      this.heredado = this.heredado.filter((p) => !p.saliendo);
    }
    if (this.construyendo) this.construir();
    this.mundo.avanzar(8);
  }

  dibujar(ctx) {
    // Los hilos de los que cuelga el puente heredado.
    ctx.strokeStyle = rgba(CONFIG.paleta.experiencia, 0.16);
    ctx.lineWidth = this.esc;
    const techo = this.cy - this.zh;
    for (const p of this.heredado) {
      if (!p.fija) continue;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, techo);
      ctx.stroke();
    }
    super.dibujar(ctx);
  }

  info() {
    if (!this.construyendo) return ["forma heredada: sin vínculos propios", `puntos en pie: ${this.heredado.filter((p) => p.fija).length}`];
    const columnas = this.columnas.filter((c) => c && c.vinculada).length;
    return [
      `columnas: ${columnas} / ${this.diseno.paneles + 1} · ${this.unido ? "unido" : "dos voladizos"}`,
      `hundimiento del centro: ${this.hundimiento().toFixed(1)} px`,
    ];
  }
}

// Momento 13 · Cierre (@centrodeeventosupb)
//
// Síntesis y continuidad. El puente construido sigue en pie, en calma. Cada
// cierto tiempo un pulso entra por una orilla y recorre el puente hasta la otra,
// alternando: la energía circula entre las dos generaciones y no se apaga.

class EscenaCierre extends EscenaPuente {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(13);
    this.iniciarPuente();
    this.duracionGuia = 35;
    this.construirCompleto();
    this.proximaOnda = 150;
    this.lado = 0;
  }

  actualizar() {
    if (this.tiempo >= this.proximaOnda) {
      const i = this.lado === 0 ? 1 : this.diseno.paneles - 1;
      const col = this.columnas[i];
      col.sup.vy += 2.2 * this.esc;
      col.inf.vy += 2.2 * this.esc;
      this.lado = 1 - this.lado;
      this.proximaOnda += 210;
    }
    this.mundo.avanzar(8);
  }

  info() {
    return ["el puente se sostiene solo", `la energía entra por la orilla ${this.lado === 0 ? "de la experiencia" : "de los jóvenes"}`];
  }
}
