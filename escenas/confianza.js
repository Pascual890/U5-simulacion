// Momento 7 · "El talento crece a la velocidad de la confianza."
//
// Un puente entre el momento 6 (la comunidad) y el 8 (las rutas). Las personas
// de la comunidad que se formó en el momento 6 se quedan, casi en el mismo
// lugar, y sus vínculos forman una red ramificada, como la de una comunidad
// real: cada persona unida a unas pocas cercanas.
//
// Gramática:
//   nodo                -> persona (las dos generaciones)
//   resorte entre nodos -> relación
//   rigidez del resorte -> confianza (el vínculo se ve más firme)
//   pulso que viaja     -> talento (nace en una persona joven, con un destello)
//   camino encendido    -> por donde pasó el talento
//
// Al principio la confianza es baja: los vínculos son tenues y flojos, y cada
// pulso de talento se apaga a uno o dos pasos de donde nació. La confianza
// sube sola: los vínculos se afirman y cada pulso llega más lejos y más rápido.
// Los caminos por donde pasa el talento quedan encendidos, así que el talento
// dibuja una ramificación que crece por la comunidad hasta recorrerla entera.
// Es el anticipo de las rutas del momento 8.
//
// Física: en una red de resortes, un empujón viaja como una onda y su
// velocidad es v ≈ separación · √(k / m). Si sube la rigidez k (confianza), el
// talento viaja más rápido y, con la misma fricción, llega más lejos. Todas las
// masas son iguales para que la única variable sea la confianza.

class EscenaConfianza extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    this.brilloPropio = true;
    this.mundo.friccion = 0.018;

    this.kMin = 0.001;
    this.kMax = 0.2;
    this.confianza = 0; // 0..1
    this.inicioConfianza = 240; // la confianza es baja los primeros 4 s...
    this.duracionConfianza = 720; // ...y crece durante 12 s
    this.intervaloPulso = 150; // un pulso de talento cada 2,5 s
    this.primerPulso = 140; // después de que la comunidad se acomoda
    this.proximoPulso = this.primerPulso;
    this.destello = 0;

    this.crearComunidad();
  }

  crearComunidad() {
    randomSeed(7);
    this.sep = 34 * this.esc;
    const rx = 0.78 * this.zw;
    const ry = 0.72 * this.zh;

    // Lugares repartidos de forma orgánica: al azar, pero nunca más cerca que
    // una separación mínima (como personas que conservan su espacio).
    const sitios = [];
    for (let intento = 0; intento < 6000 && sitios.length < 130; intento += 1) {
      const [x, y] = puntoEnElipse(this.cx, this.cy, rx, ry);
      if (sitios.every((s) => (s.x - x) ** 2 + (s.y - y) ** 2 >= this.sep ** 2)) sitios.push({ x, y });
    }

    // Quienes ya eran comunidad en el momento 6 ocupan primero los lugares más
    // cercanos a donde están; después el resto de las personas heredadas; los
    // lugares que sobran se llenan con personas nuevas.
    this.emparejar(sitios, this.disponibles.filter((q) => q.d?.estado === "comunidad"));
    this.emparejar(sitios, this.disponibles.filter((q) => q.tipo === "experiencia" || q.tipo === "joven"));
    const nodos = sitios.map((s) => {
      const opciones = { masa: 1, rigidezCasa: 0.002 };
      let p;
      if (s.q) {
        this.disponibles.splice(this.disponibles.indexOf(s.q), 1);
        p = this.preparar(s.q, s.q.tipo, s.x, s.y, opciones);
      } else {
        p = this.nodo(random() < 0.35 ? "experiencia" : "joven", s.x, s.y, { ...opciones, adoptar: false });
      }
      p.d.talento = 0;
      p.d.vecinos = [];
      return p;
    });

    // La fuente del talento: la persona joven más cercana al centro de la comunidad.
    const jovenes = nodos.filter((p) => p.tipo === "joven");
    this.fuente = (jovenes.length ? jovenes : nodos).reduce((m, p) =>
      (p.casaX - this.cx) ** 2 + (p.casaY - this.cy) ** 2 < (m.casaX - this.cx) ** 2 + (m.casaY - this.cy) ** 2 ? p : m,
    );

    // Los vínculos forman venas que salen de la fuente: cada persona se une a
    // su vecina más cercana entre las que están más cerca de la fuente. Así todo
    // camino lleva hacia afuera y el talento puede abrirse en todas las
    // direcciones, como una flor. Algunos vínculos cortos extra entre ramas
    // vecinas cierran pequeños ciclos, como en una comunidad.
    const f = this.fuente;
    const aFuente = (p) => Math.hypot(p.casaX - f.casaX, p.casaY - f.casaY);
    const dist = (p, q) => Math.hypot(p.casaX - q.casaX, p.casaY - q.casaY);
    const unir = (p, q) => {
      this.vincular(p, q, this.kMin, 0.01, { desdeCasas: true });
      p.d.vecinos.push(q);
      q.d.vecinos.push(p);
    };
    const orden = [...nodos].sort((a, b) => aFuente(a) - aFuente(b));
    orden.forEach((p, i) => {
      if (i === 0) return;
      const anteriores = orden.slice(0, i);
      const cercanos = anteriores.filter((q) => dist(p, q) < 1.8 * this.sep);
      const candidatos = cercanos.length ? cercanos : anteriores;
      unir(p, candidatos.reduce((m, q) => (dist(p, q) < dist(p, m) ? q : m)));
    });
    for (let i = 0; i < nodos.length; i += 1) {
      for (let j = i + 1; j < nodos.length; j += 1) {
        const [p, q] = [nodos[i], nodos[j]];
        if (p.d.vecinos.length >= 3 || q.d.vecinos.length >= 3 || p.d.vecinos.includes(q)) continue;
        if (dist(p, q) > 1.2 * this.sep || random() > 0.2) continue;
        unir(p, q);
      }
    }
  }

  // Asigna personas a lugares libres, emparejando primero los más cercanos.
  emparejar(sitios, candidatos) {
    const pares = [];
    for (const s of sitios) {
      if (s.q) continue;
      for (const q of candidatos) pares.push([(q.x - s.x) ** 2 + (q.y - s.y) ** 2, s, q]);
    }
    pares.sort((a, b) => a[0] - b[0]);
    const usados = new Set(sitios.filter((s) => s.q).map((s) => s.q));
    for (const [, s, q] of pares) {
      if (s.q || usados.has(q)) continue;
      usados.add(q);
      s.q = q;
    }
  }

  rigidez() {
    return this.kMin + (this.kMax - this.kMin) * this.confianza ** 2;
  }

  // Empujón a los vecinos de la fuente, hacia afuera: de ahí nace la onda.
  pulso() {
    const f = this.fuente;
    for (const p of f.d.vecinos) {
      const dx = p.x - f.x;
      const dy = p.y - f.y;
      const d = Math.hypot(dx, dy) || 1;
      p.vx += (dx / d) * 4 * this.esc;
      p.vy += (dy / d) * 4 * this.esc;
    }
    this.destello = 1;
  }

  actualizar() {
    this.confianza = suavizar((this.tiempo - this.inicioConfianza) / this.duracionConfianza);
    const k = this.rigidez();
    for (const r of this.mundo.resortes) r.rigidez = k;

    if (this.tiempo >= this.proximoPulso) {
      this.pulso();
      this.proximoPulso += this.intervaloPulso;
    }

    this.mundo.avanzar(3);

    // Brillo = energía que transporta cada elemento en este instante.
    //   persona: energía cinética -> ∝ rapidez
    //   vínculo: energía elástica -> ∝ √k · estiramiento
    // Cada persona y cada vínculo guardan como "talento" el brillo más alto que
    // han recibido y lo pierden despacio: así quedan encendidos los caminos por
    // donde pasó. Mientras una persona viaja a su lugar no cuenta: ese movimiento
    // no le llegó por un vínculo.
    const registrar = this.tiempo >= this.primerPulso;
    for (const p of this.mundo.particulas) {
      const mov = p.guia > 0 ? 0 : escalaLog(p.rapidez() / this.esc, 0.02, 0.6);
      if (registrar) p.d.talento = Math.max(p.d.talento * 0.9985, mov);
      p.brillo = Math.max(mov, 0.55 * p.d.talento);
      p.d.escala = 1 + 0.45 * p.d.talento;
    }
    const raizK = Math.sqrt(k);
    for (const r of this.mundo.resortes) {
      const energia = r.a.guia > 0 || r.b.guia > 0 ? 0 : escalaLog(raizK * Math.abs(r.estiramiento), 0.0008, 0.012);
      r.talento = registrar ? Math.max((r.talento || 0) * 0.9985, energia) : 0;
      r.energia = energia;
    }
    this.destello *= 0.93;
  }

  // Cada vínculo con los colores de sus dos personas. Su firmeza muestra la
  // confianza; su brillo, el talento que pasó por él.
  dibujarResorte(ctx, r) {
    const vis = r.activacion * Math.min(r.a.alfa, r.b.alfa);
    if (vis < 0.01) return;
    const c = this.confianza;
    const t = Math.max(r.talento || 0, r.energia || 0);
    const alfa = vis * Math.min(1, 0.07 + 0.2 * c + 0.75 * t);
    if (r.a.tipo !== r.b.tipo) {
      const g = ctx.createLinearGradient(r.a.x, r.a.y, r.b.x, r.b.y);
      g.addColorStop(0, rgba(r.a.color, alfa));
      g.addColorStop(1, rgba(r.b.color, alfa));
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = rgba(r.a.color, alfa);
    }
    ctx.lineWidth = (0.8 + 0.5 * c + 1.5 * t) * this.esc;
    ctx.beginPath();
    ctx.moveTo(r.a.x, r.a.y);
    ctx.lineTo(r.b.x, r.b.y);
    ctx.stroke();
  }

  dibujar(ctx) {
    super.dibujar(ctx);
    this.dibujarDestello(ctx, this.fuente.x, this.fuente.y, Math.max(0.15, this.destello));
  }

  // Datos para la vista de depuración (tecla D, solo para ensayar).
  info() {
    const k = this.rigidez();
    const velocidad = this.sep * Math.sqrt(k) * 60;
    const encendidos = this.mundo.resortes.filter((r) => (r.talento || 0) > 0.3).length;
    return [
      `confianza ${this.confianza.toFixed(2)} · rigidez k = ${k.toFixed(3)} · v ≈ ${Math.round(velocidad)} px/s`,
      `caminos encendidos por el talento: ${encendidos} de ${this.mundo.resortes.length}`,
    ];
  }
}
