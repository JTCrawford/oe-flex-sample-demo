/**
 * Recolor a recognition still with the same OE texture the 3D viewer samples.
 * Background, tires, boot-topping red, and pale rounds stay. Paint takes the pattern.
 */
export function paintRecognitionPlate(
  canvas: HTMLCanvasElement,
  plate: HTMLImageElement,
  camo: HTMLImageElement,
  tile: number,
): boolean {
  const srcW = plate.naturalWidth;
  const srcH = plate.naturalHeight;
  if (!srcW || !srcH) return false;
  const scale = srcW > 960 ? 960 / srcW : 1;
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(plate, 0, 0, w, h);
  const plateData = ctx.getImageData(0, 0, w, h);

  const camoW = camo.naturalWidth;
  const camoH = camo.naturalHeight;
  if (!camoW || !camoH) return false;
  const scratch = document.createElement('canvas');
  scratch.width = camoW;
  scratch.height = camoH;
  const cctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!cctx) return false;
  cctx.drawImage(camo, 0, 0);
  const camoData = cctx.getImageData(0, 0, camoW, camoH);

  const pixels = plateData.data;
  const pattern = camoData.data;
  const bgR = pixels[0];
  const bgG = pixels[1];
  const bgB = pixels[2];
  const tilePx = Math.max(24, tile * scale);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      if (dr * dr + dg * dg + db * db < 26 * 26) continue;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const sat = maxc - minc;
      if (luma < 36) continue;
      if (sat > 52) continue;
      if (luma > 188 && sat < 36) continue;
      const cx = Math.floor((((x % tilePx) / tilePx) * camoW) % camoW);
      const cy = Math.floor((((y % tilePx) / tilePx) * camoH) % camoH);
      const ci = (cy * camoW + cx) * 4;
      const shade = Math.min(1.12, Math.max(0.42, luma / 150));
      pixels[i] = Math.min(255, pattern[ci] * shade);
      pixels[i + 1] = Math.min(255, pattern[ci + 1] * shade);
      pixels[i + 2] = Math.min(255, pattern[ci + 2] * shade);
    }
  }
  ctx.putImageData(plateData, 0, 0);
  return true;
}
