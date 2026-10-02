// Motor físico mínimo: partículas con masa unidas por resortes (ley de Hooke).
// Es la misma idea de los capítulos de fuerzas, oscilaciones y sistemas de
// partículas de Nature of Code: cada cuadro se suman las fuerzas, a = F / m,
// la velocidad cambia con la aceleración y la posición cambia con la velocidad.
//
// Las unidades son píxeles y cuadros (1 cuadro ≈ 1/60 s).

class Particula {
  constructor(x, y, masa = 1) {
    this.id = Particula.siguienteId++;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.fx = 0;
    this.fy = 0;
    this.masa = masa;

    // "Casa": posición de reposo. Un resorte la une a ella (rigidezCasa).
    // Representa el lugar propio de cada elemento dentro de la estructura.
    this.casaX = x;
    this.casaY = y;
    this.rigidezCasa = 0;

    this.fija = false; // un apoyo: no se mueve
    this.escalaGravedad = 1; // cuánto le afecta la gravedad del mundo

    // Guía (0..1): cuando la estructura se reorganiza entre momentos, un resorte
    // con amortiguación crítica lleva a la partícula a su nueva casa sin rebotar.
    this.guia = 0;
  }

  aplicarFuerza(fx, fy) {
    this.fx += fx;
    this.fy += fy;
  }

  rapidez() {
    return Math.hypot(this.vx, this.vy);
  }
}

Particula.siguienteId = 1;

class Resorte {
  constructor(a, b, rigidez, amortiguacion = 0, largoReposo = null) {
    this.a = a;
    this.b = b;
    this.rigidez = rigidez;
    this.amortiguacion = amortiguacion;
    this.largoReposo = largoReposo ?? Math.hypot(b.x - a.x, b.y - a.y);
    this.estiramiento = 0; // (largo - largoReposo) / largoReposo: + estirado, − comprimido
    this.activacion = 1; // 0..1: un vínculo que se está formando todavía no tira con toda su fuerza
  }

  aplicar() {
    const { a, b } = this;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const largo = Math.hypot(dx, dy) || 0.0001;
    const nx = dx / largo;
    const ny = dy / largo;
    const extension = largo - this.largoReposo;

    // Ley de Hooke: la fuerza es proporcional a cuánto se estira el resorte.
    let fuerza = this.rigidez * extension;

    // Amortiguación: frena la velocidad con la que los extremos se separan o
    // se acercan. Disipa el movimiento relativo, no el movimiento conjunto.
    const velocidadRelativa = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    fuerza += this.amortiguacion * velocidadRelativa;
    fuerza *= this.activacion;

    a.aplicarFuerza(fuerza * nx, fuerza * ny);
    b.aplicarFuerza(-fuerza * nx, -fuerza * ny);
    this.estiramiento = extension / this.largoReposo;
  }
}

class Mundo {
  constructor() {
    this.particulas = [];
    this.resortes = [];
    this.friccion = 0; // fracción de velocidad que se pierde por cuadro
    this.gravedad = { x: 0, y: 0 }; // aceleración (px / cuadro²)
    this.kGuia = 0.003;
    this.cGuia = 2 * Math.sqrt(this.kGuia); // amortiguación crítica: llega sin oscilar
  }

  agregar(p) {
    this.particulas.push(p);
    return p;
  }

  unir(a, b, rigidez, amortiguacion = 0, largoReposo = null) {
    const r = new Resorte(a, b, rigidez, amortiguacion, largoReposo);
    this.resortes.push(r);
    return r;
  }

  // Un paso de simulación de duración dt (en cuadros).
  paso(dt) {
    const g = this.gravedad;
    for (const p of this.particulas) {
      p.fx = -p.rigidezCasa * (p.x - p.casaX) + g.x * p.masa * p.escalaGravedad;
      p.fy = -p.rigidezCasa * (p.y - p.casaY) + g.y * p.masa * p.escalaGravedad;
      if (p.guia > 0) {
        p.fx -= p.guia * p.masa * (this.kGuia * (p.x - p.casaX) + this.cGuia * p.vx);
        p.fy -= p.guia * p.masa * (this.kGuia * (p.y - p.casaY) + this.cGuia * p.vy);
      }
    }

    for (const r of this.resortes) r.aplicar();

    for (const p of this.particulas) {
      if (p.fija) {
        p.vx = 0;
        p.vy = 0;
        continue;
      }
      p.vx += (p.fx / p.masa) * dt;
      p.vy += (p.fy / p.masa) * dt;
      p.vx -= p.vx * this.friccion * dt;
      p.vy -= p.vy * this.friccion * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  // Avanza un cuadro dividido en subpasos: los resortes rígidos necesitan
  // pasos pequeños para no volverse inestables.
  avanzar(subpasos = 4) {
    const dt = 1 / subpasos;
    for (let i = 0; i < subpasos; i += 1) this.paso(dt);
  }
}
