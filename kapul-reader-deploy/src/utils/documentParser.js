// Document Parser for PDF and EPUB files
// Uses PDF.js and EPUB.js for rendering

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

// Parse PDF file
export async function parsePDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const metadata = {
          numPages: pdf.numPages,
          title: file.name.replace(/\.pdf$/i, ''),
          format: 'pdf'
        };

        // Extract text from first few pages for preview
        let textContent = '';
        const pagesToExtract = Math.min(3, pdf.numPages);

        for (let i = 1; i <= pagesToExtract; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const pageText = text.items.map(item => item.str).join(' ');
          textContent += pageText + '\n\n';
        }

        resolve({
          ...metadata,
          previewText: textContent.trim(),
          arrayBuffer: arrayBuffer
        });
      } catch (error) {
        reject(new Error('Failed to parse PDF: ' + error.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Render PDF page to canvas
export async function renderPDFPage(arrayBuffer, pageNumber, canvas, scale = 1.5) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return {
      width: viewport.width,
      height: viewport.height,
      numPages: pdf.numPages
    };
  } catch (error) {
    console.error('PDF render error:', error);
    throw error;
  }
}

// Get PDF text content for a specific page
export async function getPDFPageText(arrayBuffer, pageNumber) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    return textContent.items.map(item => item.str).join(' ');
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return '';
  }
}

// Extract cover image from PDF first page
export async function extractPDFCover(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // Use a smaller scale for thumbnail
    const scale = 0.5;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert to data URL (JPEG for smaller size)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    return dataUrl;
  } catch (error) {
    console.error('PDF cover extraction error:', error);
    return null;
  }
}

// Parse EPUB file
export async function parseEPUB(file) {
  // Dynamic import for epub.js since it has browser-specific requirements
  const ePub = (await import('epubjs')).default;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const book = ePub(arrayBuffer);

        await book.ready;

        const metadata = await book.loaded.metadata;
        const navigation = await book.loaded.navigation;
        const spine = book.spine;

        // Get table of contents
        const toc = navigation.toc.map(item => ({
          label: item.label,
          href: item.href
        }));

        // Estimate page count
        const numPages = spine.length * 3; // Rough estimate

        // Extract preview text from first chapter
        let previewText = '';
        if (spine.length > 0) {
          try {
            const firstSection = spine.get(0);
            if (firstSection) {
              const doc = await firstSection.load(book.load.bind(book));
              previewText = doc.body?.textContent?.slice(0, 1000) || '';
            }
          } catch (e) {
            console.log('Could not extract preview text');
          }
        }

        resolve({
          title: metadata.title || file.name.replace(/\.epub$/i, ''),
          author: metadata.creator || 'Unknown Author',
          numPages: numPages,
          format: 'epub',
          toc: toc,
          previewText: previewText.trim(),
          arrayBuffer: arrayBuffer
        });
      } catch (error) {
        reject(new Error('Failed to parse EPUB: ' + error.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Create EPUB renderer
export async function createEPUBReader(arrayBuffer, containerElement) {
  const ePub = (await import('epubjs')).default;

  try {
    const book = ePub(arrayBuffer);
    const rendition = book.renderTo(containerElement, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated'
    });

    await rendition.display();

    return {
      book,
      rendition,
      next: () => rendition.next(),
      prev: () => rendition.prev(),
      goto: (location) => rendition.display(location),
      getCurrentLocation: () => rendition.currentLocation(),
      destroy: () => {
        rendition.destroy();
        book.destroy();
      }
    };
  } catch (error) {
    console.error('EPUB reader error:', error);
    throw error;
  }
}

// Parse document based on file type
export async function parseDocument(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await parsePDF(file);
  } else if (fileName.endsWith('.epub')) {
    return await parseEPUB(file);
  } else {
    throw new Error('Unsupported file format. Please use PDF or EPUB files.');
  }
}

// Get total page count for progress tracking
export function calculateProgress(currentPage, totalPages) {
  if (!totalPages || totalPages === 0) return 0;
  return Math.round((currentPage / totalPages) * 100);
}

// Extract keywords from text for quiz generation
export function extractKeywords(text) {
  // Simple keyword extraction - removes common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// Utility to convert ArrayBuffer to Base64 for storage
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility to convert Base64 back to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
