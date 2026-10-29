import * as THREE from 'three';
import { COLORS, hex } from './constants';
import { createRng, range } from './random';

/**
 * Texturas 100 % procedurales (canvas 2D, tamaños pequeños). No se descarga nada.
 */

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D no disponible en este navegador.');
  }
  return [canvas, ctx];
}

function finish(canvas: HTMLCanvasElement, anisotropy = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/** Porcelanato de 50 cm: la textura contiene 2×2 baldosas y se repite cada metro. */
export function createFloorTileTexture(repeatX: number, repeatZ: number): THREE.CanvasTexture {
  const size = 512;
  const half = size / 2;
  const [canvas, ctx] = makeCanvas(size, size);
  const rng = createRng(11);

  for (let ty = 0; ty < 2; ty += 1) {
    for (let tx = 0; tx < 2; tx += 1) {
      const tone = 226 + Math.round(range(rng, -5, 5));
      const gradient = ctx.createLinearGradient(tx * half, ty * half, (tx + 1) * half, (ty + 1) * half);
      gradient.addColorStop(0, `rgb(${tone + 5},${tone + 4},${tone})`);
      gradient.addColorStop(1, `rgb(${tone - 9},${tone - 9},${tone - 8})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(tx * half, ty * half, half, half);

      // Vetas suaves tipo mármol.
      ctx.strokeStyle = 'rgba(140,142,150,0.12)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i += 1) {
        const x0 = tx * half + rng() * half;
        ctx.beginPath();
        ctx.moveTo(x0, ty * half);
        ctx.bezierCurveTo(
          x0 + range(rng, -60, 60),
          ty * half + half * 0.35,
          x0 + range(rng, -60, 60),
          ty * half + half * 0.65,
          x0 + range(rng, -80, 80),
          ty * half + half,
        );
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(120,120,128,0.08)';
    ctx.fillRect(rng() * size, rng() * size, 2, 2);
  }

  // Juntas.
  ctx.strokeStyle = '#b6b3aa';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(half, size);
  ctx.moveTo(0, half);
  ctx.lineTo(size, half);
  ctx.stroke();
  ctx.strokeRect(0, 0, size, size);

  const texture = finish(canvas, 4);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatZ);
  return texture;
}

/** Alfombra central azul marino con doble filete dorado. Se repite a lo largo (cada 2,4 m). */
export function createRunnerTexture(repeatAlong: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const rng = createRng(23);

  ctx.fillStyle = hex(COLORS.navy);
  ctx.fillRect(0, 0, size, size);

  // Trama sutil en rombos.
  ctx.strokeStyle = 'rgba(143,188,232,0.07)';
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.moveTo(i + size, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)';
    ctx.fillRect(rng() * size, rng() * size, 2, 2);
  }

  // Filetes dorados paralelos al largo (bordes izquierdo y derecho de la textura).
  ctx.fillStyle = hex(COLORS.gold);
  ctx.fillRect(10, 0, 5, size);
  ctx.fillRect(size - 15, 0, 5, size);
  ctx.fillStyle = hex(COLORS.goldDeep);
  ctx.fillRect(20, 0, 2, size);
  ctx.fillRect(size - 22, 0, 2, size);

  const texture = finish(canvas, 4);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, repeatAlong);
  return texture;
}

/** Roble claro con vetas verticales (a lo largo de V). */
export function createWoodTexture(repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const rng = createRng(37);

  ctx.fillStyle = hex(COLORS.oak);
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 70; i += 1) {
    const x = rng() * size;
    const dark = rng() > 0.45;
    ctx.strokeStyle = dark ? `rgba(92,58,28,${range(rng, 0.10, 0.28)})` : `rgba(235,205,160,${range(rng, 0.10, 0.22)})`;
    ctx.lineWidth = range(rng, 0.6, 2.4);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + range(rng, -6, 6), size * 0.33, x + range(rng, -6, 6), size * 0.66, x + range(rng, -5, 5), size);
    ctx.stroke();
  }

  const texture = finish(canvas, 4);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

/** Mancha radial blanca (halo / charco de luz). Se tiñe con el color del material. */
export function createGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const [canvas, ctx] = makeCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return finish(canvas);
}

/**
 * Sombra de contacto suave (rectángulo difuminado) para asentar muebles en el suelo
 * sin usar sombras en tiempo real.
 */
export function createSoftShadowTexture(width: number, height: number, margin: number, blur: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);
  // Truco: la figura se dibuja fuera del lienzo y solo su sombra (desplazada) entra en él.
  const off = 4000;
  ctx.shadowColor = 'rgba(0,0,0,1)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = off;
  ctx.fillStyle = '#000';
  ctx.fillRect(margin - off, margin, width - margin * 2, height - margin * 2);
  return finish(canvas);
}

/** Pantalla de caja (POS) 128×72 con marca. */
export function createPosScreenTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 72);
  const gradient = ctx.createLinearGradient(0, 0, 128, 72);
  gradient.addColorStop(0, hex(COLORS.navy));
  gradient.addColorStop(1, hex(COLORS.blue));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 72);
  ctx.fillStyle = hex(COLORS.gold);
  ctx.font = '900 26px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A/C', 64, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(22, 46, 84, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(22, 55, 56, 4);
  return finish(canvas);
}

// ---------------------------------------------------------------------------- rótulos

export interface SignStyle {
  /** Fondo opaco. `null` = texto sobre fondo transparente. */
  background: string | null;
  /** Color del texto o degradado vertical [arriba, abajo]. */
  foreground: string | readonly [string, string];
  /** Color del texto secundario (por defecto, el primer color del texto). */
  subtitle?: string;
  /** Marco interior, opcional. */
  border?: string;
}

const SERIF = 'Georgia, "Times New Roman", "Noto Serif", serif';
const SANS = '"Arial Black", "Helvetica Neue", Arial, Helvetica, sans-serif';

/** Textura de rótulo con texto (y subtítulo opcional) ajustado al ancho. Solo fuentes del sistema. */
export function createSignTexture(
  text: string,
  width: number,
  height: number,
  style: SignStyle,
  subtitle?: string,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(width, height);

  if (style.background) {
    ctx.fillStyle = style.background;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  if (style.border) {
    ctx.strokeStyle = style.border;
    ctx.lineWidth = Math.max(3, height * 0.02);
    const inset = height * 0.08;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  }

  const isMonogram = text.includes('/');
  const family = isMonogram ? SERIF : SANS;
  const maxTextWidth = width * 0.84;
  const titleScale = subtitle ? 0.5 : 0.58;
  let fontSize = height * titleScale;
  ctx.font = `900 ${fontSize}px ${family}`;
  const measured = ctx.measureText(text).width;
  if (measured > maxTextWidth) {
    fontSize *= maxTextWidth / measured;
    ctx.font = `900 ${fontSize}px ${family}`;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textY = subtitle ? height * 0.4 : height * 0.52;
  if (typeof style.foreground === 'string') {
    ctx.fillStyle = style.foreground;
  } else {
    const gradient = ctx.createLinearGradient(0, textY - fontSize / 2, 0, textY + fontSize / 2);
    gradient.addColorStop(0, style.foreground[0]);
    gradient.addColorStop(1, style.foreground[1]);
    ctx.fillStyle = gradient;
  }
  ctx.fillText(text, width / 2, textY);

  if (subtitle) {
    let subSize = height * 0.15;
    ctx.font = `700 ${subSize}px ${SANS}`;
    const letterSpacing = ctx as unknown as { letterSpacing?: string };
    if ('letterSpacing' in ctx) {
      letterSpacing.letterSpacing = `${Math.round(subSize * 0.18)}px`;
    }
    const subMeasured = ctx.measureText(subtitle).width;
    if (subMeasured > maxTextWidth) {
      subSize *= maxTextWidth / subMeasured;
      ctx.font = `700 ${subSize}px ${SANS}`;
    }
    ctx.fillStyle = style.subtitle ?? (typeof style.foreground === 'string' ? style.foreground : style.foreground[0]);
    ctx.fillText(subtitle, width / 2, height * 0.78);
  }

  return finish(canvas, 4);
}

// ---------------------------------------------------------------------------- etiquetas de producto

export type LabelId = 'blue20' | 'blue10' | 'gold10' | 'white5' | 'sky3' | 'pack15' | 'case05' | 'giftBox';

interface LabelSpec {
  top: string;
  bottom: string;
  fg: string;
  accent: string;
  title: string;
  capacity: string;
}

const LABELS: Record<LabelId, LabelSpec> = {
  blue20: { top: '#2a6fd0', bottom: '#0c2b5e', fg: '#ffffff', accent: hex(COLORS.gold), title: 'AGUA PURIFICADA', capacity: '20 L' },
  blue10: { top: '#3b82d8', bottom: '#12388a', fg: '#ffffff', accent: hex(COLORS.gold), title: 'AGUA PURIFICADA', capacity: '10 L' },
  gold10: { top: '#10347a', bottom: '#071a3d', fg: hex(COLORS.goldLight), accent: hex(COLORS.gold), title: 'PREMIUM', capacity: '10 L' },
  white5: { top: '#ffffff', bottom: '#cfe3f5', fg: hex(COLORS.navy), accent: hex(COLORS.blue), title: 'AGUA PURA', capacity: '5 L' },
  sky3: { top: '#8fbce8', bottom: '#3d83d6', fg: '#ffffff', accent: hex(COLORS.navy), title: 'AGUA MINERAL', capacity: '3 L' },
  pack15: { top: '#1f5fc0', bottom: '#0c2b5e', fg: '#ffffff', accent: hex(COLORS.gold), title: 'AGUA', capacity: '1,5 L' },
  case05: { top: '#ffffff', bottom: '#aecdee', fg: hex(COLORS.navy), accent: hex(COLORS.gold), title: 'AGUA', capacity: '500 mL' },
  giftBox: { top: '#12388a', bottom: '#071a3d', fg: hex(COLORS.goldLight), accent: hex(COLORS.gold), title: 'SET DE TAZAS', capacity: 'A/C' },
};

/** Etiqueta de garrafa / botella / caja (512×384) con marca A/C, nombre y capacidad. */
export function createLabelTexture(id: LabelId): THREE.CanvasTexture {
  const spec = LABELS[id];
  const w = 512;
  const h = 384;
  const [canvas, ctx] = makeCanvas(w, h);

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, spec.top);
  gradient.addColorStop(1, spec.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Ola decorativa inferior.
  ctx.fillStyle = spec.accent;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.bezierCurveTo(w * 0.25, h * 0.66, w * 0.5, h * 0.92, w * 0.75, h * 0.78);
  ctx.bezierCurveTo(w * 0.88, h * 0.72, w * 0.95, h * 0.74, w, h * 0.76);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Escudo con la marca.
  ctx.fillStyle = hex(COLORS.gold);
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.27, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hex(COLORS.navy);
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.27, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hex(COLORS.goldLight);
  ctx.font = `900 50px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A/C', w / 2, h * 0.27 + 3);

  ctx.fillStyle = spec.fg;
  ctx.font = `900 40px ${SANS}`;
  ctx.fillText(spec.title, w / 2, h * 0.58, w * 0.88);
  ctx.font = `900 82px ${SANS}`;
  ctx.fillText(spec.capacity, w / 2, h * 0.8, w * 0.8);

  return finish(canvas, 4);
}
