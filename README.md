# Relevo generacional · presentación generativa

Unidad 5 de Simulación: sistema de partículas que interpreta el guion de la charla
del Centro de Eventos Fórum UPB. El concepto, la gramática y las decisiones de cada
momento están en [DECISIONES.md](DECISIONES.md).

## Abrir

Doble clic en `index.html`, o con el servidor local (evita que el navegador muestre
versiones viejas de los archivos):

```
python servidor.py
```

y abrir `http://localhost:8080`. Con `#7` al final de la URL se abre directamente el momento 7.

## Controles

| Tecla | Acción |
| --- | --- |
| `→` `Espacio` `AvPág` | avanzar (en momentos de dos oraciones, primero revela la segunda) |
| `←` `RePág` | volver |
| `Inicio` / `Fin` | primer / último momento |
| `F` | pantalla completa |
| `L` | idioma ES / PT |
| `H` | ayuda |

En celular se avanza y retrocede deslizando.

La presentación no tiene controles que cambien la física en vivo: cada escena cuenta
su historia sola, siempre igual. Solo para ensayar existe la tecla `D`, que muestra los
datos de la física de la escena; no aparece en la ayuda.

## Archivos

- `momentos.js`: los 13 momentos del guion (textos ES/PT, foto, escena y si va por pasos).
- `config.js`: idioma inicial, enlaces de los QR, textos de la interfaz y paleta.
- `main.js`: navegación, texto, fotos e idioma. Avisa a `sketch.js` con el evento `momento`.
- `fisica.js`: motor físico (Particula, Resorte con ley de Hooke, Mundo con gravedad y fricción).
- `escenas/base.js`: lo común a todas las escenas, incluida la herencia de partículas entre momentos.
- `escenas/*.js`: una escena por momento (dos archivos agrupan escenas hermanas: `triada.js` para
  4 y 5, `generaciones.js` para 9 y 10, `puente.js` para 12 y 13).
- `sketch.js`: p5.js; crea la escena de cada momento y le pasa las partículas de la anterior.
- `styles.css`: composición y tipografía para pantalla grande.
- `servidor.py`: servidor local sin caché para ensayar.
- `assets/`: fotos del cliente (redimensionadas) y logos.

## Capas

De abajo hacia arriba: fotos → luz de fondo (dos luces que se acercan durante la charla) → partículas (canvas de p5) → texto → logos → interfaz.
