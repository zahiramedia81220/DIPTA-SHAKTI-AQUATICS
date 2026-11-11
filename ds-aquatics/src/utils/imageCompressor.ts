/**
 * Utility to compress images in-browser to a specified size (default target: ~200KB)
 * using HTML5 Canvas before uploading to Firebase Storage or state.
 */

export interface CompressionOptions {
  maxSizeKB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; dataUrl: string; sizeKB: number }> {
  const {
    maxSizeKB = 200,
    maxWidthOrHeight = 1280,
    initialQuality = 0.85,
  } = options;

  return new Promise((resolve, reject) => {
    // If file is already smaller than target (and is an image)
    const originalSizeKB = file.size / 1024;
    
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = () => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        // Scale down if dimensions exceed maxWidthOrHeight
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to get below maxSizeKB
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let currentSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);

        // Try reducing quality if still above target
        let attempts = 0;
        while (currentSizeKB > maxSizeKB && quality > 0.35 && attempts < 6) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          currentSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
          attempts++;
        }

        // If even with lower quality it is above target, resize down slightly more
        if (currentSizeKB > maxSizeKB && (width > 600 || height > 600)) {
          canvas.width = Math.round(width * 0.75);
          canvas.height = Math.round(height * 0.75);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          currentSizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        }

        // Convert dataUrl to Blob/File
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          { type: 'image/jpeg' }
        );

        resolve({
          file: compressedFile,
          dataUrl,
          sizeKB: currentSizeKB,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
