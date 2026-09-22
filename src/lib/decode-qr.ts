import jsQR from "jsqr";
import QRCode from "qrcode";
import { SAMPLE_UPI_URI } from "./upi";

const MAX_EDGE = 1400;

export function decodeQrFromImageData(imageData: ImageData): string | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  const data = code?.data?.trim();
  return data || null;
}

export async function decodeQrFromBlob(blob: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(blob);
  try {
    const first = readQr(bitmap, 1);
    if (first) return first;
    if (Math.max(bitmap.width, bitmap.height) < 420) {
      return readQr(bitmap, 3);
    }
    return null;
  } finally {
    bitmap.close();
  }
}

export async function makeSampleQrBlob(): Promise<Blob> {
  const dataUrl = await qrDataUrl(SAMPLE_UPI_URI);
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function qrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
}

function readQr(bitmap: ImageBitmap, scale: number): string | null {
  const fitted = fitSize(bitmap.width * scale, bitmap.height * scale, MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = fitted.width;
  canvas.height = fitted.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = scale === 1;
  ctx.drawImage(bitmap, 0, 0, fitted.width, fitted.height);
  return decodeQrFromImageData(ctx.getImageData(0, 0, fitted.width, fitted.height));
}

function fitSize(w: number, h: number, max: number): { width: number; height: number } {
  const edge = Math.max(w, h);
  if (edge <= max) return { width: Math.round(w), height: Math.round(h) };
  const s = max / edge;
  return { width: Math.round(w * s), height: Math.round(h * s) };
}
