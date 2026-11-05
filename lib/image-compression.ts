/**
 * Utilitário de compressão de imagens no cliente (navegador/celular)
 * Converte fotos pesadas de celulares (5MB a 20MB) para WebP otimizado (~150KB-250KB)
 * Redimensiona proporcionalmente para largura máxima de 1200px.
 */

export interface CompressedImageResult {
  dataUrl: string;
  blob: Blob;
  sizeKb: number;
  width: number;
  height: number;
  filename: string;
}

export async function compressImageClient(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("O arquivo selecionado não é uma imagem válida."));
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Erro ao ler o arquivo da imagem."));

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error("Erro ao decodificar a imagem."));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Redimensionamento proporcional se maior que maxWidth
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Não foi possível inicializar o contexto Canvas 2D."));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como WebP (com fallback transparente para JPEG se não suportado)
        let outputFormat = "image/webp";
        let dataUrl = canvas.toDataURL(outputFormat, quality);

        if (!dataUrl.startsWith("data:image/webp")) {
          outputFormat = "image/jpeg";
          dataUrl = canvas.toDataURL(outputFormat, quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Falha na geração do Blob otimizado."));
            }

            const cleanName = file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/[^a-zA-Z0-9_-]/g, "_");

            resolve({
              dataUrl,
              blob,
              sizeKb: Math.round(blob.size / 1024),
              width,
              height,
              filename: `${cleanName}.webp`,
            });
          },
          outputFormat,
          quality
        );
      };

      img.src = String(event.target?.result);
    };

    reader.readAsDataURL(file);
  });
}
