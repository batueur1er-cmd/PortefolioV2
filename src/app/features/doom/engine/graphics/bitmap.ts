import { Patch, Post } from './graphics.model';

/** Une image de sprite en cours de dessin, en indices de la palette (-1 : transparent). */
export class Bitmap {
  readonly pixels: Int16Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.pixels = new Int16Array(width * height).fill(-1);
  }

  set(x: number, y: number, color: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && px < this.width && py >= 0 && py < this.height) this.pixels[py * this.width + px] = color;
  }

  rect(x0: number, y0: number, x1: number, y1: number, color: (x: number, y: number) => number): void {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, color(x, y));
  }

  /** Les colonnes de posts : seules les parties opaques sont gardées, comme dans un patch de Doom. */
  toPatch(leftOffset: number, topOffset: number): Patch {
    const columns: Post[][] = [];
    for (let x = 0; x < this.width; x++) {
      const posts: Post[] = [];
      let y = 0;
      while (y < this.height) {
        if (this.pixels[y * this.width + x] < 0) {
          y++;
          continue;
        }
        const top = y;
        const run: number[] = [];
        while (y < this.height && this.pixels[y * this.width + x] >= 0) run.push(this.pixels[y++ * this.width + x]);
        posts.push({ top, pixels: Uint8Array.from(run) });
      }
      columns.push(posts);
    }
    return { width: this.width, height: this.height, leftOffset, topOffset, columns };
  }
}
