import { BACKEND } from '../config';

/** يحوّل أي صيغة لرقم جزائري إلى الشكل 0XXXXXXXXX، أو '' إذا لم يكن صالحاً. */
export function normalizePhone(raw: string): string {
  let s = raw.replace(/[\s\-.()]/g, '');
  if (s.startsWith('+213')) s = '0' + s.slice(4);
  else if (s.startsWith('00213')) s = '0' + s.slice(5);
  if (/^0[567]\d{8}$/.test(s)) return s; // موبايل
  if (/^0[1-4]\d{7,8}$/.test(s)) return s; // هاتف ثابت
  return '';
}

export const telHref = (phone: string): string => {
  const n = normalizePhone(phone);
  return n ? `tel:${n}` : '';
};

export const waHref = (phone: string): string => {
  const n = normalizePhone(phone);
  return n ? `https://wa.me/213${n.slice(1)}` : '';
};

/** لا نعرض إلا صوراً قادمة من خادمنا (https) أو صوراً محلية مؤقتة. */
export function safeImageUrl(u: string | null | undefined): string {
  if (!u) return '';
  if (u.startsWith('blob:') || u.startsWith('data:image/')) return u;
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:') return '';
    return url.origin === new URL(BACKEND.url).origin ? u : '';
  } catch {
    return '';
  }
}

export function postedLabel(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const hours = (Date.now() - t) / 36e5;
  if (hours < 24) return 'اليوم';
  if (hours < 48) return 'أمس';
  try {
    return new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(t);
  } catch {
    return new Date(t).toLocaleDateString();
  }
}

interface Loaded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function loadImage(file: File): Promise<Loaded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    } catch {
      /* ننتقل للطريقة البديلة */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image-decode'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** يصغّر الصورة (أقصى 1600px) ويحوّلها JPEG لتوفير بيانات المستخدم وتسريع الرفع. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('not-image');
  const img = await loadImage(file);
  try {
    if (!img.width || !img.height) throw new Error('empty-image');
    const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img.source, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', quality);
    });
  } finally {
    img.release();
  }
}
