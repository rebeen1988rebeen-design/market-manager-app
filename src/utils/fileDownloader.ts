/**
 * Utility for downloading or sharing files across all browsers and devices,
 * with primary support for Web Share API (navigator.share with files)
 * so file downloads work natively on iOS Safari in PWA standalone mode.
 */
export async function downloadOrShareFile(options: {
  fileBits: BlobPart[];
  fileName: string;
  mimeType: string;
  title?: string;
  text?: string;
}): Promise<boolean> {
  const { fileBits, fileName, mimeType, title, text } = options;

  // Create File instance
  const file = new File(fileBits, fileName, { type: mimeType });

  // 1. Primary Method: Native Web Share API (Files share sheet on iOS Safari / PWA Standalone Mode & Mobile)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || fileName,
          text: text || fileName,
        });
        return true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed/cancelled the native share menu
        return true;
      }
      console.warn('Web Share API failed, falling back to anchor download:', err);
    }
  }

  // 2. Standard Anchor Link Download (Desktop browsers, Android Chrome)
  try {
    const blob = new Blob(fileBits, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);
    return true;
  } catch (err) {
    console.warn('Anchor element download failed:', err);
  }

  // 3. Fallback: Open Blob URL in window/location for constrained webviews
  try {
    const blob = new Blob(fileBits, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      window.location.href = blobUrl;
    }
    return true;
  } catch (err) {
    console.error('All file save/share strategies failed:', err);
    return false;
  }
}
