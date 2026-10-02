// Momento 2 · "¿Un gran auditorio solo para hacer grados?"
//
// Un solo uso: la energía no se queda. El auditorio es un cuenco rígido de
// experiencia, anclado con fuerza: una estructura grande con una sola función.
// Cada promoción de jóvenes se reúne, celebra (es lanzada hacia arriba, como
// los birretes de la foto) y se va. Nadie se vincula con el espacio, así que
// después de cada ceremonia el cuenco queda vacío y nada se acumula.
//
// Física: emisor de partículas con gravedad y vida útil (capítulo de sistemas
// de partículas de Nature of Code).

class EscenaGrados extends Escena {
  constructor(ancho, alto, paso, herencia) {
    super(ancho, alto, paso, herencia);
    randomSeed(2);
    this.mundo.friccion = 0.004;
    this.g = 0.09 * this.esc;

    // El auditorio: un cuenco rígido.
    const n = 30;
    const rx = this.zw * 0.92;
    const ry = this.zh * 0.62;
    const cyCuenco = this.cy - 0.05 * this.zh;
    this.fondo = cyCuenco + ry;
    this.cuenco = [];
    for (let i = 0; i < n; i += 1) {
      const a = Math.PI * (0.08 + (0.84 * i) / (n - 1));
      this.cuenco.push(this.nodo("experiencia", this.cx - Math.cos(a) * rx, cyCuenco + Math.sin(a) * ry, { rigidezCasa: 0.18 }));
    }
    for (let i = 0; i < n - 1; i += 1) this.vincular(this.cuenco[i], this.cuenco[i + 1], 0.3, 0.05, { desdeCasas: true });
    for (let i = 0; i < n - 2; i += 1) this.vincular(this.cuenco[i], this.cuenco[i + 2], 0.15, 0.05, { desdeCasas: true });

    this.centroClase = { x: this.cx, y: cyCuenco + ry * 0.62 };
    this.radioClase = this.zw * 0.24;
    this.promocion = 0;
    this.nuevaPromocion(true);
  }

  // Llega una promoción: se reúne en el centro del cuenco.
  nuevaPromocion(heredar = false) {
    this.promocion += 1;
    this.clase = [];
    for (let i = 0; i < 44; i += 1) {
      const [x, y] = puntoEnElipse(this.centroClase.x, this.centroClase.y, this.radioClase, this.radioClase * 0.45);
      this.clase.push(this.nodo("joven", x, y, { rigidezCasa: 0.004, adoptar: heredar }));
    }
    this.fase = "reunir";
    this.tFase = 0;
  }

  // La celebración: cada persona sale disparada hacia arriba.
  lanzar() {
    this.fase = "vuelo";
    this.tFase = 0;
    const subida = Math.sqrt(2 * this.g * this.zh * 0.95);
    for (const p of this.clase) {
      p.rigidezCasa = 0;
      p.guia = 0;
      p.d.volando = true;
      p.vy = -subida * random(0.8, 1.15);
      p.vx = (p.x - this.centroClase.x) * 0.02 + randomGaussian() * 0.5 * this.esc;
    }
  }

  actualizar() {
    this.tFase += 1;
    if (this.fase === "reunir" && this.tFase > (this.promocion === 1 ? 140 : 90)) this.lanzar();

    if (this.fase === "vuelo") {
      for (const p of this.clase) {
        if (!p.d.volando) continue;
        p.vy += this.g; // gravedad
        // Vida útil: al caer por debajo del auditorio, se va.
        if (p.y > this.fondo + 0.15 * this.zh || this.tFase > 260) {
          p.d.volando = false;
          this.quitar(p);
        }
      }
      if (!this.clase.some((p) => p.d.volando)) {
        this.fase = "vacio";
        this.tFase = 0;
      }
    }

    if (this.fase === "vacio" && this.tFase > 70) this.nuevaPromocion();
    this.mundo.avanzar(3);
  }

  info() {
    const fases = { reunir: "se reúne", vuelo: "celebra y se va", vacio: "el auditorio queda vacío" };
    return [`promoción ${this.promocion}: ${fases[this.fase]}`, "vínculos que quedan con el espacio: 0"];
  }
}
