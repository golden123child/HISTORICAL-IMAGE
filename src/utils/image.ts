const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function isAcceptedImage(file: File): boolean {
  const typeOk = ACCEPTED_TYPES.includes(file.type.toLowerCase());
  const name = file.name.toLowerCase();
  const extOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  return typeOk || extOk;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const { width, height } = img;
          let targetW = width;
          let targetH = height;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            targetW = Math.round(width * scale);
            targetH = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }
          ctx.drawImage(img, 0, 0, targetW, targetH);
          // Use JPEG for photos for size; keep PNG if original was PNG with transparency? 
          // For simplicity and storage, use JPEG unless webp/png - prefer jpeg for size.
          const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, JPEG_QUALITY);
          resolve(dataUrl);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
