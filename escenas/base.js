// Clase base de todas las escenas.
//
// Continuidad entre momentos: cuando cambia el momento, la escena nueva recibe
// las partículas de la anterior (su "herencia") y las reutiliza. Cada persona
// viaja a su lugar en la nueva estructura en vez de desaparecer; solo las que
// sobran se desvanecen, y los vínculos anteriores se sueltan poco a poco.
// La estructura se transforma: no se reemplaza.

const RADIO_NODO = { experiencia: 4.4, joven: 2.9, hibrido: 3.6, mundo: 2.4 };

class Escena {
  constructor(ancho, alto, paso = 0, herencia = null) {
    this.ancho = ancho;
    this.alto = alto;
    this.paso = paso;
    this.esc = Math.min(ancho, alto) / 900;
    this.mundo = new Mundo();
    this.tiempo = 0;

    this.escalaNodos = 1;
    this.alfaResortes = 0.3;
    this.grosorResortes = 1.15;
    this.degradados = false; // vínculos entre tipos distintos dibujados con degradado
    this.brilloPropio = false; // la escena calcula el brillo de cada nodo
    this.duracionGuia = 70; // cuadros que dura la guía antes de soltarse

    // Zona de la escena: a la derecha de la columna de texto (arriba en pantallas verticales).
    if (ancho >= alto) {
      this.cx = ancho * 0.69;
      this.cy = alto * 0.52;
      this.zw = ancho * 0.24;
      this.zh = alto * 0.36;
    } else {
      this.cx = ancho * 0.5;
      this.cy = alto * 0.36;
      this.zw = ancho * 0.42;
      this.zh = alto * 0.22;
    }

    this.disponibles = herencia ? herencia.particulas.slice() : [];
    this.fantasmas = herencia ? herencia.fantasmas.slice() : [];
    this.lineasSaliendo = herencia ? herencia.lineas.slice() : [];
    if (herencia) {
      for (const r of herencia.resortes) {
        const vis = r.activacion * (r.a.d?.visibilidad ?? 1) * (r.b.d?.visibilidad ?? 1);
        if (vis > 0.05) this.lineasSaliendo.push({ a: r.a, b: r.b, alfa: 0.7 * vis });
      }
    }
  }

  // Lo que recibe la escena siguiente.
  herencia() {
    return {
      particulas: this.mundo.particulas,
      resortes: this.mundo.resortes,
      fantasmas: this.fantasmas,
      lineas: this.lineasSaliendo,
    };
  }

  // Las partículas heredadas que esta escena no usó se desvanecen.
  cerrarHerencia() {
    for (const q of this.disponibles) {
      q.saliendo = true;
      this.fantasmas.push(q);
    }
    this.disponibles = [];
  }

  // ---------- Personas (nodos) ----------

  // Crea un nodo en (x, y). Si hay una partícula heredada del mismo tipo, usa la
  // más cercana: esa persona viaja hasta aquí guiada.
  nodo(tipo, x, y, opciones = {}) {
    const p = opciones.adoptar === false ? null : this.buscarDisponible(tipo, x, y, opciones.cualquierTipo);
    return this.preparar(p, tipo, x, y, opciones);
  }

  // Adopta una partícula heredada concreta, dejándola donde está.
  adoptarDirecto(q, opciones = {}) {
    const i = this.disponibles.indexOf(q);
    if (i >= 0) this.disponibles.splice(i, 1);
    return this.preparar(q, q.tipo, q.x, q.y, { ...opciones, quieta: true });
  }

  buscarDisponible(tipo, x, y, cualquierTipo = false) {
    let mejor = -1;
    let mejorD = Infinity;
    for (let i = 0; i < this.disponibles.length; i += 1) {
      const q = this.disponibles[i];
      if (!cualquierTipo && q.tipo !== tipo) continue;
      const d = (q.x - x) ** 2 + (q.y - y) ** 2;
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    }
    return mejor < 0 ? null : this.disponibles.splice(mejor, 1)[0];
  }

  preparar(p, tipo, x, y, { masa = MASA_TIPO[tipo] ?? 1, rigidezCasa = 0, cualquierTipo = false, quieta = false } = {}) {
    if (p) {
      if (!cualquierTipo) p.tipo = tipo;
      p.guia = quieta ? 0 : 1;
      p.edadGuia = 0;
    } else {
      p = new Particula(x, y, masa);
      p.alfa = 0; // aparece poco a poco
      p.tono = random(); // su punto en el degradado de la UPB, para toda la charla
      p.tipo = tipo;
      p.color = colorDeTipo(tipo, p);
      p.guia = 0;
      p.edadGuia = 0;
    }
    p.masa = masa;
    p.casaX = x;
    p.casaY = y;
    p.rigidezCasa = rigidezCasa;
    p.fija = false;
    p.escalaGravedad = 1;
    p.saliendo = false;
    p.brillo = 0;
    p.d = {}; // datos propios de la escena
    p.colorObjetivo = colorDeTipo(p.tipo, p);
    this.mundo.agregar(p);
    return p;
  }

  // Un apoyo: viaja guiado hasta su lugar y ahí queda fijo.
  fijarAlLlegar(p) {
    if (p.guia > 0) {
      p.d.fijarAlLlegar = true;
      p.escalaGravedad = 0; // mientras viaja no pesa
    } else {
      p.fija = true;
      p.x = p.casaX;
      p.y = p.casaY;
    }
  }

  // Toma de una lista de reserva la partícula más cercana a (x, y) y la guía hasta allí.
  reclutar(lista, x, y) {
    let mejor = 0;
    let mejorD = Infinity;
    lista.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    });
    const p = lista.splice(mejor, 1)[0];
    p.casaX = x;
    p.casaY = y;
    p.rigidezCasa = 0;
    p.escalaGravedad = 1;
    p.guia = 1;
    p.edadGuia = 0;
    return p;
  }

  // Saca un nodo de la estructura: sus vínculos se sueltan y él se desvanece.
  quitar(p) {
    const i = this.mundo.particulas.indexOf(p);
    if (i >= 0) this.mundo.particulas.splice(i, 1);
    const quedan = [];
    for (const r of this.mundo.resortes) {
      if (r.a === p || r.b === p) this.lineasSaliendo.push({ a: r.a, b: r.b, alfa: 0.6 * r.activacion });
      else quedan.push(r);
    }
    this.mundo.resortes = quedan;
    p.saliendo = true;
    this.fantasmas.push(p);
  }

  // ---------- Vínculos (resortes) ----------

  // desdeCasas: el largo de reposo es la distancia entre las casas (la forma
  // que la estructura debe tener), no la distancia actual.
  vincular(a, b, rigidez, amortiguacion = 0, opciones = {}) {
    let largo = opciones.largo ?? null;
    if (largo === null && opciones.desdeCasas) largo = Math.hypot(b.casaX - a.casaX, b.casaY - a.casaY);
    const r = this.mundo.unir(a, b, rigidez, amortiguacion, largo);
    r.activacion = opciones.inmediato ? 1 : 0;
    r.velActivacion = opciones.velActivacion ?? 1 / 45;
    return r;
  }

  soltar(r) {
    const i = this.mundo.resortes.indexOf(r);
    if (i < 0) return;
    this.mundo.resortes.splice(i, 1);
    this.lineasSaliendo.push({ a: r.a, b: r.b, alfa: 0.7 * r.activacion });
  }

  // ---------- Ciclo ----------

  actualizarBase() {
    this.tiempo += 1;
    const esc = this.esc;
    for (const p of this.mundo.particulas) {
      if (p.alfa < 1) p.alfa = Math.min(1, p.alfa + 0.025);
      if (p.guia > 0) {
        p.edadGuia += 1;
        if (p.edadGuia > this.duracionGuia) p.guia = Math.max(0, p.guia - 0.02);
      }
      if (p.d.fijarAlLlegar && (p.guia === 0 || Math.hypot(p.x - p.casaX, p.y - p.casaY) < 2 * esc)) {
        p.fija = true;
        p.x = p.casaX;
        p.y = p.casaY;
        p.d.fijarAlLlegar = false;
      }
      if (p.color !== p.colorObjetivo) p.color = acercarColor(p.color, p.colorObjetivo, 0.05);
      if (!this.brilloPropio) p.brillo = escalaLog(p.rapidez() / esc, 0.05, 2.5);
    }
    // Un vínculo nuevo empieza a tirar cuando sus dos extremos ya llegaron a su lugar:
    // así nadie es arrastrado de golpe mientras la estructura se reorganiza.
    for (const r of this.mundo.resortes) {
      if (r.activacion >= 1) continue;
      if (this.viajando(r.a, r) || this.viajando(r.b, r)) continue;
      r.activacion = Math.min(1, r.activacion + r.velActivacion);
    }
    for (const f of this.fantasmas) {
      f.alfa -= 0.025;
      f.vx *= 0.95;
      f.vy *= 0.95;
      f.x += f.vx;
      f.y += f.vy;
    }
    this.fantasmas = this.fantasmas.filter((f) => f.alfa > 0);
    for (const l of this.lineasSaliendo) l.alfa -= 0.03;
    this.lineasSaliendo = this.lineasSaliendo.filter((l) => l.alfa > 0);
  }

  // ¿La partícula todavía está viajando hacia su casa?
  viajando(p, r) {
    if (p.guia <= 0 || p.fija) return false;
    const umbral = Math.max(12 * this.esc, 0.3 * r.largoReposo);
    return Math.hypot(p.x - p.casaX, p.y - p.casaY) > umbral;
  }

  actualizar() {
    this.mundo.avanzar(4);
  }

  setPaso(paso) {
    this.paso = paso;
  }

  info() {
    return [];
  }

  // ---------- Dibujo ----------

  dibujar(ctx) {
    this.dibujarLineasSaliendo(ctx);
    this.dibujarResortes(ctx);
    this.dibujarFantasmas(ctx);
    this.dibujarNodos(ctx);
  }

  colorDeResorte(r) {
    return r.a.tipo === r.b.tipo ? r.a.color : mezclar(r.a.color, r.b.color, 0.5);
  }

  // Energía elástica que transporta un vínculo (para su brillo): ∝ √k · estiramiento.
  energiaDe(r) {
    return escalaLog(Math.sqrt(r.rigidez) * Math.abs(r.estiramiento), 0.0015, 0.025);
  }

  dibujarResortes(ctx, lista = this.mundo.resortes) {
    for (const r of lista) this.dibujarResorte(ctx, r);
  }

  dibujarResorte(ctx, r, alfaBase = this.alfaResortes) {
    const vis =
      r.activacion *
      Math.min(r.a.alfa, r.b.alfa) *
      Math.min(r.a.d?.visibilidad ?? 1, r.b.d?.visibilidad ?? 1) *
      (r.visibilidad ?? 1);
    if (vis < 0.01) return;
    const energia = this.energiaDe(r);
    const alfa = vis * Math.min(1, alfaBase + 0.65 * energia);
    if (this.degradados && r.a.tipo !== r.b.tipo) {
      const g = ctx.createLinearGradient(r.a.x, r.a.y, r.b.x, r.b.y);
      g.addColorStop(0, rgba(r.a.color, alfa));
      g.addColorStop(1, rgba(r.b.color, alfa));
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = rgba(this.colorDeResorte(r), alfa);
    }
    ctx.lineWidth = (this.grosorResortes + energia * 1.2) * this.esc;
    ctx.beginPath();
    ctx.moveTo(r.a.x, r.a.y);
    ctx.lineTo(r.b.x, r.b.y);
    ctx.stroke();
  }

  dibujarLineasSaliendo(ctx) {
    ctx.lineWidth = this.esc;
    for (const l of this.lineasSaliendo) {
      const alfa = l.alfa * Math.min(l.a.alfa ?? 1, l.b.alfa ?? 1) * 0.5;
      if (alfa < 0.01) continue;
      ctx.strokeStyle = rgba(mezclar(l.a.color, l.b.color, 0.5), alfa);
      ctx.beginPath();
      ctx.moveTo(l.a.x, l.a.y);
      ctx.lineTo(l.b.x, l.b.y);
      ctx.stroke();
    }
  }

  dibujarNodos(ctx, lista = this.mundo.particulas) {
    for (const p of lista) this.dibujarNodo(ctx, p);
  }

  dibujarFantasmas(ctx) {
    for (const f of this.fantasmas) this.dibujarNodo(ctx, f);
  }

  dibujarNodo(ctx, p) {
    const vis = p.alfa * (p.d?.visibilidad ?? 1);
    if (vis <= 0.01) return;
    const radio = (RADIO_NODO[p.tipo] ?? 3) * this.esc * this.escalaNodos * (p.d?.escala ?? 1);
    const b = p.brillo || 0;
    if (b > 0.08) {
      ctx.fillStyle = rgba(p.color, 0.13 * b * vis);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radio * (2 + 1.8 * b), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = rgba(p.color, vis * (0.42 + 0.58 * b));
    ctx.beginPath();
    ctx.arc(p.x, p.y, radio, 0, Math.PI * 2);
    ctx.fill();
  }

  // Destello circular (origen de un impulso).
  dibujarDestello(ctx, x, y, intensidad, color = CONFIG.paleta.talento) {
    if (intensidad < 0.02) return;
    ctx.fillStyle = rgba(color, 0.12 + intensidad * 0.3);
    ctx.beginPath();
    ctx.arc(x, y, (8 + intensidad * 18) * this.esc, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(color, 0.4 + 0.6 * intensidad);
    ctx.beginPath();
    ctx.arc(x, y, 4 * this.esc, 0, Math.PI * 2);
    ctx.fill();
  }
}
