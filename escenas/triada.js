// Momentos 4 y 5: los tres actores y Fórum.
//
// Estructura común: Fórum (un núcleo de nodos híbridos) en el centro, unido
// por cables de resortes a tres actores. Están en el orden en que se lee la
// frase, en el sentido de las agujas del reloj: Academia (arriba a la
// izquierda), Industria (a la derecha) y Ciudad (abajo a la izquierda). Cada
// actor mezcla las dos generaciones. Ningún actor queda en vertical: la pantalla
// es más ancha que alta y así tienen más espacio para moverse.

const ACTORES = ["Academia", "Industria", "Ciudad"];

class EscenaTresActores extends Escena {
  // masaHub: masa de cada nodo de Fórum. rigidezActor: resorte de cada nodo de
  // un actor a su casa (por unidad de masa). kCable: rigidez de los cables.
  // radio: distancia de Fórum a cada actor, relativa a la zona de la escena.
  // cCable: amortiguación de los cables.
  construirTriada({ masaHub, rigidezActor, kCable, cCable = 0.05, radio = 0.85 }) {
    const esc = this.esc;
    this.sep = 30 * esc;
    this.R = radio * Math.min(this.zw, this.zh);

    // Fórum: un núcleo de nodos híbridos, casi libre.
    const sitiosHub = discoHex(7, 20 * esc, this.cx, this.cy);
    this.hub = sitiosHub.map((s) => this.nodo("hibrido", s.x, s.y, { masa: masaHub, rigidezCasa: 0.002 * masaHub }));
    for (const [i, j] of vecinosHex(sitiosHub)) this.vincular(this.hub[i], this.hub[j], 0.3, 0.05, { desdeCasas: true });

    this.actores = [-120, 0, 120].map((grados, i) => {
      const angulo = (grados * Math.PI) / 180;
      const u = { x: Math.cos(angulo), y: Math.sin(angulo) };
      const centro = { x: this.cx + u.x * this.R, y: this.cy + u.y * this.R };
      const sitios = discoHex(19, this.sep, centro.x, centro.y, { desorden: 0.06 });
      const nodos = sitios.map((s) => {
        const tipo = random() < 0.4 ? "experiencia" : "joven";
        const masa = tipo === "experiencia" ? 2 : 1;
        const p = this.nodo(tipo, s.x, s.y, { masa, rigidezCasa: rigidezActor * masa });
        p.d.actor = i;
        p.d.casa0 = { x: s.x, y: s.y };
        return p;
      });
      for (const [a, b] of vecinosHex(sitios)) this.vincular(nodos[a], nodos[b], 0.2, 0.05, { desdeCasas: true });

      // Cable entre Fórum y el actor: una cadena tensa de nodos híbridos.
      const desde = this.hub.reduce((m, p) => ((p.casaX - this.cx) * u.x + (p.casaY - this.cy) * u.y > (m.casaX - this.cx) * u.x + (m.casaY - this.cy) * u.y ? p : m));
      const hasta = nodos.reduce((m, p) => ((p.casaX - centro.x) * u.x + (p.casaY - centro.y) * u.y < (m.casaX - centro.x) * u.x + (m.casaY - centro.y) * u.y ? p : m));
      const cable = [desde];
      const n = 4;
      for (let k = 1; k <= n; k += 1) {
        const t = k / (n + 1);
        cable.push(this.nodo("hibrido", desde.casaX + (hasta.casaX - desde.casaX) * t, desde.casaY + (hasta.casaY - desde.casaY) * t, { masa: 0.5 }));
      }
      cable.push(hasta);
      const resortesCable = [];
      for (let k = 0; k < cable.length - 1; k += 1) {
        const a = cable[k];
        const b = cable[k + 1];
        const r = this.vincular(a, b, kCable, cCable, { largo: Math.hypot(b.casaX - a.casaX, b.casaY - a.casaY) * 0.92 });
        r.largo0 = r.largoReposo;
        resortesCable.push(r);
      }
      return { nombre: ACTORES[i], nodos, centro, u, cable, resortesCable };
    });
  }

  centroHub() {
    return centroDe(this.hub);
  }
}

// Momento 4 · "Academia + Industria + Ciudad"
//
// Un armonógrafo. Fórum es la pluma: no tiene ritmo propio y su recorrido queda
// dibujado (la estela). Cada actor tiene su propio ritmo y tira de Fórum por su
// cable. Los actores entran uno por uno, en el orden de la frase:
//   solo Academia               -> Fórum va y viene: una línea.
//   Academia + Industria        -> la línea se abre: una curva.
//   Academia + Industria + Ciudad -> una figura que ninguno de los tres dibuja
//                                  solo.
// El "+" de la frase es literalmente una suma: el principio de superposición.
// La estela es híbrida porque es lo que nace de la unión.
//
// Física: cada actor es un oscilador forzado: su casa se aleja de Fórum y
// vuelve a su propio ritmo, a lo largo de la línea que los une (tira de su
// cable, nunca lo afloja). Los cables son rígidos comparados con Fórum, así que
// Fórum sigue la suma de los tres tirones:
// desplazamiento ≈ 2/3 · (a₁·u₁ + a₂·u₂ + a₃·u₃).

class EscenaTriada extends EscenaTresActores {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(4);
    this.mundo.friccion = 0.02;
    this.construirTriada({ masaHub: 0.6, rigidezActor: 0.02, kCable: 0.15, cCable: 0.15, radio: 0.6 });

    // Academia lenta, Industria intermedia, Ciudad rápida: periodos de 5 s, 3,3 s y
    // 2,5 s (frecuencias en proporción 2 : 3 : 4). Por esa proporción la figura se
    // cierra cada 10 s y se vuelve a dibujar sobre sí misma, en vez de enredarse.
    // Entran con 5 s de diferencia: cada etapa dura al menos un ciclo completo.
    const ritmos = [
      { periodo: 300, entra: 100 },
      { periodo: 200, entra: 400 },
      { periodo: 150, entra: 700 },
    ];
    this.actores.forEach((a, i) => Object.assign(a, ritmos[i]));
    this.recorrido = 1.0 * this.R; // cuánto se aleja cada actor cuando tira
    this.largoEstela = 600; // un ciclo completo de la figura (10 s)
    this.estela = [];
  }

  // Cuántos actores están tirando de Fórum.
  activos() {
    return this.actores.filter((a) => this.tiempo >= a.entra).length;
  }

  actualizar() {
    for (const a of this.actores) {
      const t = this.tiempo - a.entra;
      if (t < 0) continue;
      const d = this.recorrido * suavizar(t / 90) * 0.5 * (1 - Math.cos((t * TWO_PI) / a.periodo));
      for (const p of a.nodos) {
        p.casaX = p.d.casa0.x + a.u.x * d;
        p.casaY = p.d.casa0.y + a.u.y * d;
      }
    }
    this.mundo.avanzar(3);
    if (this.tiempo >= this.actores[0].entra) {
      this.estela.push(this.centroHub());
      if (this.estela.length > this.largoEstela) this.estela.shift();
    }
  }

  dibujarEstela(ctx) {
    const n = this.estela.length;
    if (n < 2) return;
    const color = colorDeTipo("hibrido", { tono: 0.5 });
    ctx.lineCap = "round";
    // Dos trazos: un halo ancho y tenue, y la línea nítida encima.
    for (const [ancho, alfa] of [
      [6, 0.12],
      [2, 0.85],
    ]) {
      ctx.lineWidth = ancho * this.esc;
      for (let i = 1; i < n; i += 1) {
        ctx.strokeStyle = rgba(color, alfa * (0.1 + 0.9 * (i / n) ** 1.5));
        ctx.beginPath();
        ctx.moveTo(this.estela[i - 1].x, this.estela[i - 1].y);
        ctx.lineTo(this.estela[i].x, this.estela[i].y);
        ctx.stroke();
      }
    }
  }

  dibujar(ctx) {
    this.dibujarEstela(ctx);
    super.dibujar(ctx);
  }

  info() {
    const activos = this.activos();
    const suma = this.actores.slice(0, Math.max(1, activos)).map((a) => a.nombre).join(" + ");
    const figura = ["Fórum quieto", "una línea", "una curva", "una figura que ninguno dibuja solo"][activos];
    return [`tiran de Fórum: ${activos ? suma : "nadie"}`, `la estela dibuja ${figura}`];
  }
}

// Momento 5 · "Los eventos nunca fueron el objetivo. / El impacto sí."
//
// La misma estructura del momento 4, en calma. Un evento convoca: nace en Fórum
// (un destello) y durante el evento el lugar de cada actor está en Fórum: los
// tres se reúnen ahí y sus cables se acortan con ellos. Cuando el evento
// termina, cada actor vuelve a su lugar, tirado por el resorte que lo une a su
// casa.
// Paso 1, el evento: los actores se reúnen y vuelven exactamente a su lugar (el
// contorno punteado). Respuesta elástica: pasó algo, nada cambió.
// Paso 2, el impacto: el mismo evento, pero los actores que se encuentran en
// Fórum se vinculan entre sí. Al volver, esos vínculos tiran en contra de sus
// casas: la estructura queda deformada y Academia, Industria y Ciudad quedan
// unidas directamente, sin pasar por Fórum. Cada evento deja un vínculo más
// entre cada par, así que la deformación crece con cada evento hasta que el
// equilibrio entre casas y vínculos se estabiliza. El contorno punteado muestra
// cuánto cambió la forma: eso es el impacto.
//
// Física: resortes a la casa (la elasticidad), vínculos que se forman por
// cercanía y repulsión de corto alcance (dos personas no ocupan el mismo lugar).
// Los cables a Fórum se mantienen tensos, sin empujar ni arrastrar.

class EscenaImpacto extends EscenaTresActores {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(5);
    this.mundo.friccion = 0.03;
    this.degradados = true;
    this.construirTriada({ masaHub: 0.6, rigidezActor: 0.01, kCable: 0.6 });
    // Dónde se reúne cada actor durante el evento: cerca de Fórum, en su misma dirección.
    for (const a of this.actores) {
      a.encuentro = { x: this.cx + a.u.x * 3.4 * this.sep - a.centro.x, y: this.cy + a.u.y * 3.4 * this.sep - a.centro.y };
    }

    this.contornos = this.actores.map((a) => ({
      x: a.centro.x,
      y: a.centro.y,
      r: Math.max(...a.nodos.map((p) => Math.hypot(p.casaX - a.centro.x, p.casaY - a.centro.y))) + 10 * this.esc,
    }));
    this.periodoEvento = 260; // un evento cada ~4,3 s
    this.proximoEvento = 110;
    this.evento = null;
    this.destello = 0;
    this.eventos = 0;
    this.directos = []; // vínculos nuevos entre actores
    this.porPar = [0, 0, 0]; // vínculos entre Academia-Industria, Industria-Ciudad, Ciudad-Academia
    this.maxPorPar = 5;
  }

  iniciarEvento() {
    this.evento = { t0: this.tiempo, nuevos: [0, 0, 0] };
    this.destello = 1;
    this.eventos += 1;
  }

  // Cuánto avanzó el evento hacia el encuentro (0 = cada uno en su lugar,
  // 1 = todos reunidos en Fórum): van, se quedan un momento y vuelven.
  reunion(t) {
    if (t < 15) return 0;
    if (t < 75) return suavizar((t - 15) / 60);
    if (t < 115) return 1;
    if (t < 175) return 1 - suavizar((t - 115) / 60);
    return 0;
  }

  // Paso 2: dos personas de actores distintos que se encuentran en Fórum se
  // vinculan. El vínculo nace con el largo que tenían al encontrarse. Cada
  // evento deja un vínculo nuevo entre cada par de actores: el impacto se acumula.
  vincularEncuentros() {
    const alcance = 2.8 * this.sep;
    const { nuevos } = this.evento;
    for (let i = 0; i < 3; i += 1) {
      if (nuevos[i] >= 1 || this.porPar[i] >= this.maxPorPar) continue;
      const j = (i + 1) % 3;
      let par = null;
      let mejor = alcance;
      for (const a of this.actores[i].nodos) {
        if (a.d.directos) continue;
        for (const b of this.actores[j].nodos) {
          if (b.d.directos) continue;
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          if (d < mejor) {
            mejor = d;
            par = [a, b];
          }
        }
      }
      if (!par) continue;
      const [a, b] = par;
      this.directos.push(this.vincular(a, b, 0.03, 0.02, { velActivacion: 1 / 20 }));
      a.d.directos = true;
      b.d.directos = true;
      nuevos[i] += 1;
      this.porPar[i] += 1;
    }
  }

  // Los cables se recogen o se sueltan según la distancia entre Fórum y el actor,
  // como una cuerda que siempre queda tensa: acompañan al actor sin empujarlo ni
  // arrastrarlo. En este momento lo que mueve a los actores son sus casas y sus
  // vínculos.
  tensarCables() {
    for (const a of this.actores) {
      const extremos = [a.cable[0], a.cable[a.cable.length - 1]];
      const largo = Math.hypot(extremos[1].x - extremos[0].x, extremos[1].y - extremos[0].y);
      for (const r of a.resortesCable) r.largoReposo = (0.92 * largo) / a.resortesCable.length;
    }
  }

  // Repulsión de corto alcance entre personas de grupos distintos (y Fórum):
  // en la convocatoria se juntan, pero no se encima uno sobre otro.
  espacioPersonal() {
    const minimo = 0.9 * this.sep;
    const nodos = [...this.hub, ...this.actores.flatMap((a) => a.nodos)];
    for (let i = 0; i < nodos.length; i += 1) {
      const a = nodos[i];
      for (let j = i + 1; j < nodos.length; j += 1) {
        const b = nodos[j];
        if (a.d.actor === b.d.actor) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= minimo || d < 0.01) continue;
        const f = (minimo - d) * 0.03;
        a.vx -= (dx / d) * f;
        a.vy -= (dy / d) * f;
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
      }
    }
  }

  actualizar() {
    if (this.tiempo >= this.proximoEvento) {
      this.iniciarEvento();
      this.proximoEvento += this.periodoEvento;
    }
    if (this.evento) {
      const t = this.tiempo - this.evento.t0;
      const g = this.reunion(t);
      for (const a of this.actores) {
        for (const p of a.nodos) {
          p.casaX = p.d.casa0.x + a.encuentro.x * g;
          p.casaY = p.d.casa0.y + a.encuentro.y * g;
        }
      }
      if (this.paso >= 1 && t > 50 && t < 125 && t % 3 === 0) this.vincularEncuentros();
      if (t >= 175) this.evento = null;
    }
    this.tensarCables();
    this.espacioPersonal();
    this.destello *= 0.93;
    this.mundo.avanzar(4);
  }

  dibujar(ctx) {
    // La forma original, como referencia para ver si algo cambió.
    ctx.save();
    ctx.setLineDash([4 * this.esc, 7 * this.esc]);
    ctx.lineWidth = this.esc;
    ctx.strokeStyle = rgba(CONFIG.paleta.experiencia, 0.32);
    for (const c of this.contornos) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    super.dibujar(ctx);
    const c = this.centroHub();
    this.dibujarDestello(ctx, c.x, c.y, this.destello);
  }

  // Cuánto se alejó cada actor de su lugar original (promedio, en px).
  deformacion() {
    const d = this.actores.map((a) => {
      const c = centroDe(a.nodos);
      return Math.hypot(c.x - a.centro.x, c.y - a.centro.y);
    });
    return d.reduce((s, x) => s + x, 0) / d.length;
  }

  info() {
    const lineas = [`eventos: ${this.eventos} · deformación ${this.deformacion().toFixed(0)} px`];
    if (this.paso < 1) lineas.push("respuesta elástica: vuelve a su forma");
    else lineas.push(`impacto: ${this.directos.length} vínculos directos entre actores`);
    return lineas;
  }
}
