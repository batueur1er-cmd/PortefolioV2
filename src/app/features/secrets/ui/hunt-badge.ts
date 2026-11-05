import { formatElapsed } from '../data/hunt-clock';

export interface BadgeInfo {
  readonly owner: string;
  readonly found: number;
  readonly total: number;
  /** Durée de la chasse, en ms, si elle est terminée. */
  readonly time: number | null;
  readonly best: number | null;
}

/**
 * Un badge 1200 × 630 à partager : « J'ai trouvé les 15 secrets du portfolio de… ».
 * Dessiné dans un canevas aux couleurs de la singularité, puis téléchargé en PNG.
 */
export function downloadHuntBadge(doc: Document, info: BadgeInfo): void {
  const canvas = doc.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const style = doc.defaultView?.getComputedStyle(doc.documentElement);
  const color = (name: string, fallback: string) => style?.getPropertyValue(name).trim() || fallback;
  const voidBg = color('--void', '#03020a');
  const glow = color('--void-glow', '#ffaa50');
  const light = color('--void-light', '#ffe9d0');
  const text = color('--void-text', '#e1d7ff');
  const serif = color('--serif', 'Georgia, serif');
  const mono = color('--mono', 'monospace');

  ctx.fillStyle = voidBg;
  ctx.fillRect(0, 0, 1200, 630);

  // Le trou noir : un disque sombre cerclé d'un anneau lumineux.
  const cx = 930;
  const cy = 315;
  const halo = ctx.createRadialGradient(cx, cy, 80, cx, cy, 260);
  halo.addColorStop(0, glow);
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = voidBg;
  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = light;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 190, 46, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Des étoiles, toujours les mêmes (pseudo-hasard déterministe).
  ctx.fillStyle = text;
  for (let i = 0; i < 90; i++) {
    const x = (i * 397) % 1200;
    const y = (i * 211) % 630;
    ctx.globalAlpha = 0.25 + ((i * 37) % 60) / 100;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = glow;
  ctx.font = `500 22px ${mono}`;
  ctx.fillText('SINGULARITÉ ATTEINTE', 80, 140);
  ctx.fillStyle = light;
  ctx.font = `400 74px ${serif}`;
  ctx.fillText(`J'ai trouvé les ${info.found}`, 80, 240);
  ctx.fillText(`secrets du portfolio`, 80, 320);
  ctx.fillText(`de ${info.owner}`, 80, 400);
  ctx.fillStyle = text;
  ctx.font = `400 24px ${mono}`;
  const details = [`${info.found}/${info.total} secrets`];
  if (info.time !== null) details.push(`en ${formatElapsed(info.time)}`);
  if (info.best !== null) details.push(`record ${formatElapsed(info.best)}`);
  ctx.fillText(details.join(' · '), 80, 480);
  ctx.globalAlpha = 0.6;
  ctx.fillText('À vous : deux fenêtres, et un peu de patience.', 80, 540);
  ctx.globalAlpha = 1;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.download = `badge-singularite-${info.owner.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
