// Document Viewer Component for PDF and EPUB files
import React, { useState, useEffect, useRef } from 'react';
import { renderPDFPage, getPDFPageText, createEPUBReader } from '../utils/documentParser';

// PDF Viewer Component
export function PDFViewer({ fileData, onPageChange, onTextSelect, initialPage = 1 }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const renderingRef = useRef(false);

  // Use refs for callbacks to prevent re-render loops
  const onPageChangeRef = useRef(onPageChange);
  const onTextSelectRef = useRef(onTextSelect);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    onTextSelectRef.current = onTextSelect;
  }, [onTextSelect]);

  // Render current page - only depends on fileData, currentPage, scale
  useEffect(() => {
    const renderPage = async () => {
      if (!fileData || !canvasRef.current || renderingRef.current) return;

      renderingRef.current = true;
      setError(null);

      try {
        const result = await renderPDFPage(fileData, currentPage, canvasRef.current, scale);
        setNumPages(result.numPages);
        setCanvasSize({ width: result.width, height: result.height });

        // Build text layer for selection
        if (textLayerRef.current && result.textItems) {
          textLayerRef.current.innerHTML = '';
          result.textItems.forEach(item => {
            if (item.str.trim()) {
              const span = document.createElement('span');
              span.textContent = item.str;
              span.style.cssText = `
                position: absolute;
                left: ${item.left}px;
                top: ${item.top}px;
                font-size: ${item.fontSize}px;
                font-family: sans-serif;
                color: transparent;
                white-space: pre;
                pointer-events: all;
                user-select: text;
              `;
              textLayerRef.current.appendChild(span);
            }
          });
        }

        if (onPageChangeRef.current) {
          onPageChangeRef.current(currentPage, result.numPages);
        }
      } catch (err) {
        console.error('PDF render error:', err);
        setError('Failed to render page');
      } finally {
        renderingRef.current = false;
        setInitialLoading(false);
      }
    };

    renderPage();
  }, [fileData, currentPage, scale]);

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 3 && onTextSelectRef.current) {
      onTextSelectRef.current(text);
    }
  };

  // Navigation
  const goToPage = (page) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Zoom controls
  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage(prev => Math.min(prev + 1, numPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage(prev => Math.max(prev - 1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <style>{`
        .pdf-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
        }
        .pdf-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          gap: 12px;
          flex-wrap: wrap;
        }
        .pdf-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pdf-btn {
          padding: 6px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pdf-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }
        .pdf-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pdf-page-input {
          width: 50px;
          padding: 6px 8px;
          text-align: center;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 13px;
        }
        .pdf-page-info {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .pdf-zoom {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pdf-zoom-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          cursor: pointer;
        }
        .pdf-zoom-level {
          font-size: 12px;
          color: var(--text-secondary);
          min-width: 45px;
          text-align: center;
        }
        .pdf-canvas-container {
          flex: 1;
          overflow: auto;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 20px;
        }
        .pdf-page-wrapper {
          position: relative;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .pdf-canvas {
          display: block;
          background: white;
        }
        .pdf-text-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          line-height: 1;
        }
        .pdf-text-layer ::selection {
          background: rgba(184, 87, 12, 0.3);
        }
        .pdf-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          z-index: 10;
        }
        .pdf-error {
          color: var(--danger);
          padding: 20px;
          text-align: center;
        }
      `}</style>

      <div className="pdf-toolbar">
        <div className="pdf-nav">
          <button className="pdf-btn" onClick={prevPage} disabled={currentPage <= 1}>
            ← Prev
          </button>
          <input
            type="number"
            className="pdf-page-input"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            min={1}
            max={numPages}
          />
          <span className="pdf-page-info">of {numPages}</span>
          <button className="pdf-btn" onClick={nextPage} disabled={currentPage >= numPages}>
            Next →
          </button>
        </div>

        <div className="pdf-zoom">
          <button className="pdf-zoom-btn" onClick={zoomOut}>−</button>
          <span className="pdf-zoom-level">{Math.round(scale * 100)}%</span>
          <button className="pdf-zoom-btn" onClick={zoomIn}>+</button>
        </div>
      </div>

      <div className="pdf-canvas-container">
        {initialLoading && <div className="pdf-loading-overlay">Loading document...</div>}
        {error && <div className="pdf-error">{error}</div>}
        <div className="pdf-page-wrapper" style={{ width: canvasSize.width, height: canvasSize.height }}>
          <canvas ref={canvasRef} className="pdf-canvas" />
          <div
            ref={textLayerRef}
            className="pdf-text-layer"
            onMouseUp={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}

// EPUB Viewer Component
export function EPUBViewer({ fileData, onPageChange, onTextSelect, initialLocation = null }) {
  const containerRef = useRef(null);
  const readerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);

  // Use refs for callbacks to avoid stale closures without triggering re-init
  const onPageChangeRef = useRef(onPageChange);
  const onTextSelectRef = useRef(onTextSelect);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    onTextSelectRef.current = onTextSelect;
  }, [onTextSelect]);

  // Initialize EPUB reader
  useEffect(() => {
    if (!fileData || !containerRef.current) return;

    const initReader = async () => {
      setLoading(true);
      setError(null);

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create reader with start location (null starts at beginning)
        const reader = await createEPUBReader(fileData, containerRef.current, initialLocation);
        readerRef.current = reader;

        // Get table of contents
        const navigation = await reader.book.loaded.navigation;
        setToc(navigation.toc || []);

        // Handle location changes
        reader.rendition.on('locationChanged', (location) => {
          setCurrentLocation(location);
          if (onPageChangeRef.current && location?.start?.cfi) {
            const progress = reader.book.locations.percentageFromCfi(location.start.cfi);
            onPageChangeRef.current(Math.round((progress || 0) * 100), 100);
          }
        });

        // Handle text selection
        reader.rendition.on('selected', (cfiRange, contents) => {
          const selection = contents.window.getSelection();
          const text = selection?.toString().trim();
          if (text && text.length > 3 && onTextSelectRef.current) {
            onTextSelectRef.current(text);
          }
        });
      } catch (err) {
        console.error('EPUB init error:', err);
        setError('Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    initReader();

    return () => {
      if (readerRef.current) {
        readerRef.current.destroy();
        readerRef.current = null;
      }
    };
  }, [fileData, initialLocation]);

  // Navigation
  const nextPage = () => readerRef.current?.next();
  const prevPage = () => readerRef.current?.prev();
  const goToChapter = (href) => {
    readerRef.current?.goto(href);
    setShowToc(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="epub-viewer">
      <style>{`
        .epub-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg);
          position: relative;
        }
        .epub-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .epub-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .epub-btn {
          padding: 6px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .epub-btn:hover {
          background: var(--bg-tertiary);
        }
        .epub-content {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .epub-reader-container {
          width: 100%;
          height: 100%;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        .epub-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--text-secondary);
          z-index: 10;
        }
        .epub-error {
          color: var(--danger);
          padding: 20px;
          text-align: center;
        }
        .epub-toc {
          position: absolute;
          top: 48px;
          left: 0;
          width: 280px;
          max-height: calc(100% - 48px);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 0 8px 8px 0;
          box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          overflow-y: auto;
          z-index: 100;
        }
        .epub-toc-header {
          padding: 12px 16px;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .epub-toc-close {
          background: none;
          border: none;
          font-size: 18px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .epub-toc-item {
          padding: 10px 16px;
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          transition: background 0.15s;
        }
        .epub-toc-item:hover {
          background: var(--bg-secondary);
        }
      `}</style>

      <div className="epub-toolbar">
        <div className="epub-nav">
          <button className="epub-btn" onClick={() => setShowToc(!showToc)}>
            ☰ Contents
          </button>
          <button className="epub-btn" onClick={prevPage}>← Prev</button>
          <button className="epub-btn" onClick={nextPage}>Next →</button>
        </div>
      </div>

      {showToc && (
        <div className="epub-toc">
          <div className="epub-toc-header">
            <span>Table of Contents</span>
            <button className="epub-toc-close" onClick={() => setShowToc(false)}>×</button>
          </div>
          {toc.map((item, index) => (
            <div
              key={index}
              className="epub-toc-item"
              onClick={() => goToChapter(item.href)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      <div className="epub-content">
        {loading && <div className="epub-loading-overlay">Loading book...</div>}
        {error && <div className="epub-error">{error}</div>}
        <div ref={containerRef} className="epub-reader-container" />
      </div>
    </div>
  );
}

// Universal Document Viewer that switches based on format
export function DocumentViewer({ book, fileData, onPageChange, onTextSelect }) {
  if (!book || !fileData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-secondary)'
      }}>
        Select a book from your library to start reading
      </div>
    );
  }

  if (book.format === 'pdf') {
    return (
      <PDFViewer
        fileData={fileData}
        onPageChange={onPageChange}
        onTextSelect={onTextSelect}
        initialPage={book.lastPage || 1}
      />
    );
  }

  if (book.format === 'epub') {
    return (
      <EPUBViewer
        fileData={fileData}
        onPageChange={onPageChange}
        onTextSelect={onTextSelect}
        initialLocation={book.lastLocation}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-secondary)'
    }}>
      Unsupported format: {book.format}
    </div>
  );
}

export default DocumentViewer;
