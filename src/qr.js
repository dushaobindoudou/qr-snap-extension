import jsQR from 'jsqr';
import QRCode from 'qrcode';

export async function decodeRegion(image, rect) {
  const canvas = document.createElement('canvas');
  const x = Math.max(0, Math.floor(rect?.x ?? 0));
  const y = Math.max(0, Math.floor(rect?.y ?? 0));
  const width = Math.min(image.naturalWidth - x, Math.ceil(rect?.width ?? image.naturalWidth));
  const height = Math.min(image.naturalHeight - y, Math.ceil(rect?.height ?? image.naturalHeight));
  if (width <= 0 || height <= 0) return null;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  return jsQR(pixels.data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

export function generate(canvas, content) {
  return QRCode.toCanvas(canvas, content, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#102a43', light: '#ffffff' } });
}
