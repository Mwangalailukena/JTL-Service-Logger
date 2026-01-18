export const ImageUtils = {
  /**
   * Compresses an image file to a WebP Data URL with specified quality and dimensions.
   * @param file The original image file.
   * @param maxWidth Maximum width of the output image (default 1280px).
   * @param quality Quality of the WebP compression (0-1, default 0.8).
   * @returns Promise resolving to the Data URL string.
   */
  compressImage: (file: File, maxWidth = 1280, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if wider than max
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to WebP for efficient storage
          // Fallback to jpeg if browser doesn't support webp encoding (rare now)
          const compressedDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }
};
