import type { Material } from 'three';
import type { StoreContext } from '../context';

/** Parche de suelo con un fino perfil dorado en el borde. Se etiqueta como "suelo" (no entra en la verificación de zonas). */
export function zonePatch(
  { batch: b, mats: m }: StoreContext,
  material: Material,
  cx: number,
  cz: number,
  w: number,
  d: number,
): void {
  const previous = b.label;
  b.label = 'suelo';
  b.box(material, w, 0.014, d, cx, 0.007, cz);
  const edge = 0.04;
  b.box(m.goldMatte, w, 0.006, edge, cx, 0.017, cz - d / 2 + edge / 2);
  b.box(m.goldMatte, w, 0.006, edge, cx, 0.017, cz + d / 2 - edge / 2);
  b.box(m.goldMatte, edge, 0.006, d - edge * 2, cx - w / 2 + edge / 2, 0.017, cz);
  b.box(m.goldMatte, edge, 0.006, d - edge * 2, cx + w / 2 - edge / 2, 0.017, cz);
  b.label = previous;
}

/**
 * Sombra de contacto suave bajo un mueble (sin sombras en tiempo real). Se dibuja sobre el
 * suelo y sobre los parches de suelo (y = 0,02). Etiquetada como "suelo".
 */
export function softShadow({ batch: b, mats: m }: StoreContext, cx: number, cz: number, w: number, d: number): void {
  const previous = b.label;
  b.label = 'suelo';
  const pad = 0.4;
  const sw = w + pad;
  const sd = d + pad;
  if (sw / sd >= 1.8) {
    b.plane(m.shadowWide, sw, sd, cx, 0.02, cz, { rx: -Math.PI / 2 });
  } else if (sd / sw >= 1.8) {
    b.plane(m.shadowWide, sd, sw, cx, 0.02, cz, { rx: -Math.PI / 2, ry: Math.PI / 2 });
  } else {
    b.plane(m.shadowSquare, sw, sd, cx, 0.02, cz, { rx: -Math.PI / 2 });
  }
  b.label = previous;
}
