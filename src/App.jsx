// Kapul Reader v2.0 - Production Ready
// By Kapul Learning Systems (KLS)

import React, { useState, useRef, useEffect } from 'react';
import { KLSLogo } from './components/KLSLogo';
import { DocumentViewer } from './components/DocumentViewer';
import { parseDocument, extractPDFCover, extractEPUBCover } from './utils/documentParser';
import {
  initDB,
  getBooks,
  addBook,
  updateBook,
  deleteBook as deleteBookFromStorage,
  saveFileData,
  getFileData,
  getHighlights,
  addHighlight,
  deleteHighlight,
  getFlashcards,
  addFlashcard,
  saveProgress,
  getProgress,
  getStudyStats,
  saveQuizScore,
  getSettings,
  saveSettings,
  setCurrentBook,
  getCurrentBook
} from './utils/storage';
import {
  explainText,
  solveProblem,
  generateFlashcards,
  checkAPIStatus
} from './utils/ai';

// Icons
const LibraryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const ReadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const StudyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function App() {
  // Core state
  const [activeTab, setActiveTab] = useState('library');
  const [books, setBooks] = useState([]);
  const [currentBookId, setCurrentBookId] = useState(null);
  const [currentFileData, setCurrentFileData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Reader state
  const [selectedText, setSelectedText] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAIResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Study state
  const [highlights, setHighlights] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [studyStats, setStudyStats] = useState({ pagesRead: 0, problemsSolved: 0, flashcards: 0, quizScore: 0 });

  // Library state
  const [viewMode, setViewMode] = useState('grid');
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [apiModel, setApiModel] = useState('');

  const fileInputRef = useRef(null);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        const savedBooks = await getBooks();
        setBooks(savedBooks);

        const savedHighlights = await getHighlights();
        setHighlights(savedHighlights);

        const savedFlashcards = await getFlashcards();
        setFlashcards(savedFlashcards);

        const stats = await getStudyStats();
        setStudyStats(stats);

        // Check API status from server
        const apiStatus = await checkAPIStatus();
        setApiConfigured(apiStatus.configured);
        setApiModel(apiStatus.model || '');

        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsInitialized(true);
      }
    };
    initialize();
  }, []);

  // Load a book's file data
  const loadBook = async (book) => {
    setCurrentBookId(book.id);
    setCurrentBook(book.id);

    const fileData = await getFileData(book.id);
    if (fileData) {
      setCurrentFileData(fileData);
    } else {
      setCurrentFileData(null);
    }

    const progress = await getProgress(book.id);
    if (progress) {
      setReadingProgress(progress.percentage || book.progress || 0);
    } else {
      setReadingProgress(book.progress || 0);
    }
  };

  // AI actions
  const handleAI = async (mode) => {
    if (!selectedText || selectedText.trim().length < 2) {
      setAIResponse('Please select some text first.');
      return;
    }
    setIsLoading(true);
    try {
      let response;
      if (mode === 'explain') {
        response = await explainText(selectedText);
      } else if (mode === 'solve') {
        response = await solveProblem(selectedText);
      }
      setAIResponse(response || 'No response received. Please try again.');
    } catch (error) {
      setAIResponse('Error: ' + (error.message || 'Something went wrong. Please try again.'));
    }
    setIsLoading(false);
  };

  // Save highlight
  const handleSaveHighlight = async () => {
    if (!selectedText) return;
    const newHighlight = {
      text: selectedText,
      bookId: currentBookId,
      bookTitle: books.find(b => b.id === currentBookId)?.title || 'Unknown'
    };
    const updatedHighlights = await addHighlight(newHighlight);
    setHighlights(updatedHighlights);
    setShowAI(false);
    setSelectedText('');
  };

  // Generate flashcards
  const handleGenerateFlashcards = async () => {
    setIsLoading(true);
    try {
      const newCards = await generateFlashcards(selectedText);
      for (const card of newCards) {
        await addFlashcard({ ...card, bookId: currentBookId });
      }
      const updatedFlashcards = await getFlashcards();
      setFlashcards(updatedFlashcards);
      setAIResponse(`Generated ${newCards.length} flashcards!`);
    } catch (error) {
      setAIResponse('Failed to generate flashcards.');
    }
    setIsLoading(false);
  };

  // File upload handler
  const handleFileUpload = async (files) => {
    const file = files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf');
    const isEpub = fileName.endsWith('.epub');

    if (!isPdf && !isEpub) {
      setUploadError('Only PDF and EPUB files are supported');
      setTimeout(() => setUploadError(''), 3000);
      return;
    }

    setUploadProgress('Processing document...');

    try {
      const docData = await parseDocument(file);

      // Extract cover image
      let coverImage = null;
      if (docData.arrayBuffer) {
        try {
          if (isPdf) {
            coverImage = await extractPDFCover(docData.arrayBuffer);
          } else if (isEpub) {
            coverImage = await extractEPUBCover(docData.arrayBuffer);
          }
        } catch (e) {
          console.log('Could not extract cover:', e);
        }
      }

      const newBook = {
        id: Date.now(),
        title: docData.title || file.name.replace(/\.(pdf|epub)$/i, ''),
        author: docData.author || 'Unknown Author',
        progress: 0,
        format: docData.format,
        totalPages: docData.numPages || 0,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        dateAdded: new Date().toISOString(),
        coverImage: coverImage
      };

      if (docData.arrayBuffer) {
        await saveFileData(newBook.id, docData.arrayBuffer);
      }

      const updatedBooks = await addBook(newBook);
      setBooks(updatedBooks);
      setUploadProgress(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to process file: ' + error.message);
      setUploadProgress(null);
      setTimeout(() => setUploadError(''), 5000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId, e) => {
    e.stopPropagation();
    if (confirm('Remove this book from your library?')) {
      const updatedBooks = await deleteBookFromStorage(bookId);
      setBooks(updatedBooks);
      if (currentBookId === bookId) {
        setCurrentBookId(null);
        setCurrentFileData(null);
      }
    }
  };

  // Open book
  const openBook = async (book) => {
    await loadBook(book);
    setActiveTab('reader');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Handle page change
  const handlePageChange = async (currentPage, totalPages) => {
    const percentage = Math.round((currentPage / totalPages) * 100);
    setReadingProgress(percentage);

    if (currentBookId) {
      await saveProgress(currentBookId, { percentage, currentPage, totalPages });
      await updateBook(currentBookId, { progress: percentage, lastPage: currentPage });
      setBooks(prev => prev.map(b =>
        b.id === currentBookId ? { ...b, progress: percentage } : b
      ));
    }
  };

  // Settings
  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const currentBook = books.find(b => b.id === currentBookId);

  // Format AI response: convert markdown to HTML
  const formatAIResponse = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<strong style="font-size:14px;display:block;margin:8px 0 4px">$1</strong>')
      .replace(/^## (.+)$/gm, '<strong style="font-size:15px;display:block;margin:10px 0 4px">$1</strong>')
      .replace(/^# (.+)$/gm, '<strong style="font-size:16px;display:block;margin:12px 0 6px">$1</strong>')
      .replace(/^[•\-] (.+)$/gm, '<div style="padding-left:12px">• $1</div>')
      .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:12px">$1. $2</div>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg-tertiary);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        :root {
          --bg: #F9F7F3;
          --bg-secondary: #F3F1ED;
          --bg-tertiary: #EBE9E5;
          --bg-sidebar: #F3F1ED;
          --border: #DDD9D3;
          --text: #1a1915;
          --text-secondary: #5c5750;
          --text-tertiary: #9c9689;
          --accent: #B8570C;
          --accent-hover: #9A4A0A;
          --danger: #dc2626;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #1a1915;
            --bg-secondary: #252219;
            --bg-tertiary: #302d24;
            --bg-sidebar: #1f1c16;
            --border: #3d392f;
            --text: #F9F7F3;
            --text-secondary: #b5afa3;
            --text-tertiary: #7a7568;
            --accent: #D4A373;
            --accent-hover: #E5BE93;
          }
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          color: var(--text);
          line-height: 1.5;
          font-size: 14px;
        }

        .app {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
          width: 240px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: transform 0.3s ease;
          overflow: hidden;
        }

        .sidebar.collapsed {
          transform: translateX(-240px);
          visibility: hidden;
        }

        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 8px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text);
        }

        .nav-item.active {
          background: var(--bg-tertiary);
          color: var(--text);
        }

        .nav-item svg {
          opacity: 0.7;
        }

        .nav-item.active svg,
        .nav-item:hover svg {
          opacity: 1;
        }

        .sidebar-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.5;
          font-size: 11px;
          color: var(--text-secondary);
        }

        /* Main content */
        .main-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }

        .main-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .menu-btn {
          padding: 8px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text);
        }

        .page-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .main-content {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }

        .main-content.no-padding {
          padding: 0;
        }

        /* Library */
        .library-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .library-title {
          font-size: 20px;
          font-weight: 600;
        }

        .library-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          background: var(--bg-tertiary);
          border-radius: 6px;
          padding: 2px;
        }

        .view-btn {
          padding: 6px 10px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          border-radius: 4px;
        }

        .view-btn.active {
          background: var(--bg);
          color: var(--text);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--accent);
          border: none;
          border-radius: 6px;
          color: var(--bg);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .add-btn:hover {
          background: var(--accent-hover);
        }

        /* Empty state */
        .empty-library {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .drop-zone {
          width: 100%;
          max-width: 480px;
          padding: 48px 32px;
          border: 2px dashed var(--border);
          border-radius: 12px;
          background: var(--bg-secondary);
          transition: all 0.2s;
          cursor: pointer;
        }

        .drop-zone.dragging {
          border-color: var(--accent);
          background: var(--bg-tertiary);
        }

        .drop-zone-icon {
          color: var(--text-tertiary);
          margin-bottom: 16px;
        }

        .drop-zone-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }

        .drop-zone-text {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .drop-zone-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--accent);
          border: none;
          border-radius: 6px;
          color: var(--bg);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .drop-zone-formats {
          margin-top: 16px;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        /* Book Grid */
        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 20px;
        }

        .book-card {
          cursor: pointer;
          position: relative;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .book-cover {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 6px;
          overflow: hidden;
          background: var(--bg-tertiary);
          margin-bottom: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transform: translateZ(0);
        }

        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .book-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
        }

        .book-cover-initial {
          font-size: 28px;
          font-weight: 600;
          color: var(--text-tertiary);
        }

        .book-cover-format {
          position: absolute;
          bottom: 8px;
          right: 8px;
          padding: 2px 6px;
          background: rgba(0,0,0,0.6);
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }

        .book-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(0,0,0,0.2);
        }

        .book-progress-fill {
          height: 100%;
          background: var(--accent);
        }

        .book-delete {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          border: none;
          color: white;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .book-card:hover .book-delete {
          opacity: 1;
        }

        .book-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .book-author {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Book List */
        .book-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .book-list-item {
          display: flex;
          gap: 14px;
          padding: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .book-list-item:hover {
          border-color: var(--text-tertiary);
        }

        .book-list-cover {
          width: 40px;
          height: 56px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-tertiary);
        }

        .book-list-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .book-list-info {
          flex: 1;
          min-width: 0;
        }

        .book-list-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .book-list-author {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .book-list-progress {
          height: 3px;
          background: var(--bg-tertiary);
          border-radius: 2px;
        }

        .book-list-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
        }

        /* Reader */
        .reader-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .reader-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-secondary);
        }

        /* AI Panel */
        .ai-panel {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 360px;
          max-height: 60vh;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px 12px 0 0;
          padding: 16px;
          transform: translateY(100%);
          transition: transform 0.25s ease;
          z-index: 200;
          overflow-y: auto;
        }

        .ai-panel.open {
          transform: translateY(0);
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .ai-title {
          font-size: 14px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .selected-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .ai-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .ai-btn {
          flex: 1;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text);
          cursor: pointer;
        }

        .ai-btn:hover {
          background: var(--bg-secondary);
        }

        .ai-response {
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-line;
        }

        .loading {
          color: var(--text-tertiary);
          font-size: 13px;
        }

        /* Study Tab */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .card-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .card-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          font-size: 13px;
        }

        .highlight-item {
          background: var(--bg-secondary);
          border-left: 3px solid var(--accent);
          padding: 10px 12px;
          margin-bottom: 8px;
          border-radius: 0 6px 6px 0;
          font-size: 13px;
        }

        /* Settings Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 300;
        }

        .modal {
          background: var(--bg);
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 400px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 16px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
        }

        .form-hint {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
        }

        .btn-primary {
          width: 100%;
          padding: 10px;
          background: var(--accent);
          border: none;
          border-radius: 6px;
          color: var(--bg);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        /* Toast */
        .toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          z-index: 400;
        }

        .toast.error {
          background: var(--danger);
          color: white;
        }

        .toast.progress {
          background: var(--accent);
          color: var(--bg);
        }

        .file-input { display: none; }

        /* Mobile overlay */
        .sidebar-overlay {
          display: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 240px;
            z-index: 200;
            transform: translateX(0);
            visibility: visible;
          }
          .sidebar.collapsed {
            transform: translateX(-100%);
            visibility: hidden;
          }
          .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 150;
            opacity: 1;
            transition: opacity 0.3s;
          }
          .sidebar-overlay.hidden {
            opacity: 0;
            pointer-events: none;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .ai-panel {
            width: 100%;
            left: 0;
          }
          .book-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 16px;
          }
          .library-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .library-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="app">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="file-input"
        />

        {/* Mobile Overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? '' : 'hidden'}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <KLSLogo size={24} />
              <span>Kapul Reader</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => { setActiveTab('library'); setSidebarOpen(false); }}
            >
              <LibraryIcon />
              Library
            </button>
            <button
              className={`nav-item ${activeTab === 'reader' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reader'); setSidebarOpen(false); }}
            >
              <ReadIcon />
              Reader
            </button>
            <button
              className={`nav-item ${activeTab === 'study' ? 'active' : ''}`}
              onClick={() => { setActiveTab('study'); setSidebarOpen(false); }}
            >
              <StudyIcon />
              Study
            </button>
            <button
              className="nav-item"
              onClick={() => { setShowSettings(true); setSidebarOpen(false); }}
            >
              <SettingsIcon />
              Settings
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-brand">
              <KLSLogo size={14} />
              Kapul Learning Systems
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-container">
          <header className="main-header">
            <div className="main-header-left">
              <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <MenuIcon />
              </button>
              <span className="page-title">
                {activeTab === 'library' && 'Library'}
                {activeTab === 'reader' && (currentBook?.title || 'Reader')}
                {activeTab === 'study' && 'Study'}
              </span>
            </div>
          </header>

          <main className={`main-content ${activeTab === 'reader' && currentFileData ? 'no-padding' : ''}`}>
            {/* Library Tab */}
            {activeTab === 'library' && (
              <>
                {books.length === 0 ? (
                  <div className="empty-library">
                    <div
                      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="drop-zone-icon">
                        <UploadIcon />
                      </div>
                      <div className="drop-zone-title">Add your first book</div>
                      <div className="drop-zone-text">
                        Drag and drop your PDF or EPUB files here
                      </div>
                      <button className="drop-zone-btn" onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}>
                        <PlusIcon />
                        Choose File
                      </button>
                      <div className="drop-zone-formats">
                        Supported formats: PDF, EPUB
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="library-header">
                      <h1 className="library-title">Your Library</h1>
                      <div className="library-actions">
                        <div className="view-toggle">
                          <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                          >
                            Grid
                          </button>
                          <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                          >
                            List
                          </button>
                        </div>
                        <button className="add-btn" onClick={() => fileInputRef.current?.click()}>
                          <PlusIcon />
                          Add Book
                        </button>
                      </div>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="book-grid">
                        {books.map((book) => (
                          <div key={book.id} className="book-card" onClick={() => openBook(book)}>
                            <div className="book-cover">
                              {book.coverImage ? (
                                <img src={book.coverImage} alt={book.title} />
                              ) : (
                                <div className="book-cover-placeholder">
                                  <span className="book-cover-initial">{book.title.charAt(0)}</span>
                                </div>
                              )}
                              <span className="book-cover-format">{book.format}</span>
                              {book.progress > 0 && (
                                <div className="book-progress-bar">
                                  <div className="book-progress-fill" style={{ width: `${book.progress}%` }} />
                                </div>
                              )}
                              <button className="book-delete" onClick={(e) => handleDeleteBook(book.id, e)}>×</button>
                            </div>
                            <div className="book-title">{book.title}</div>
                            <div className="book-author">{book.author}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="book-list">
                        {books.map((book) => (
                          <div key={book.id} className="book-list-item" onClick={() => openBook(book)}>
                            <div className="book-list-cover">
                              {book.coverImage ? (
                                <img src={book.coverImage} alt={book.title} />
                              ) : (
                                <div className="book-cover-placeholder">
                                  <span style={{ fontSize: 14 }}>{book.title.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <div className="book-list-info">
                              <div className="book-list-title">{book.title}</div>
                              <div className="book-list-author">{book.author}</div>
                              <div className="book-list-progress">
                                <div className="book-list-progress-fill" style={{ width: `${book.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Reader Tab */}
            {activeTab === 'reader' && (
              <div className="reader-container">
                {currentFileData && currentBook ? (
                  <DocumentViewer
                    book={currentBook}
                    fileData={currentFileData}
                    onPageChange={handlePageChange}
                    onTextSelect={(text) => {
                      setSelectedText(text);
                      setShowAI(true);
                      setAIResponse('');
                    }}
                  />
                ) : (
                  <div className="reader-empty">
                    <p>Select a book from your library to start reading</p>
                  </div>
                )}
              </div>
            )}

            {/* Study Tab */}
            {activeTab === 'study' && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{studyStats.pagesRead || 0}</div>
                    <div className="stat-label">Pages read</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{highlights.length}</div>
                    <div className="stat-label">Highlights</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{flashcards.length}</div>
                    <div className="stat-label">Flashcards</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{studyStats.quizScore || 0}%</div>
                    <div className="stat-label">Quiz Score</div>
                  </div>
                </div>

                <div className="section-title">Flashcards</div>
                <div className="card-list">
                  {flashcards.length === 0 ? (
                    <div className="card-item" style={{ color: 'var(--text-secondary)' }}>
                      Select text while reading to create flashcards
                    </div>
                  ) : (
                    flashcards.slice(0, 5).map((card, i) => (
                      <div key={card.id || i} className="card-item">{card.front}</div>
                    ))
                  )}
                </div>

                <div className="section-title">Highlights</div>
                {highlights.length === 0 ? (
                  <div className="highlight-item" style={{ borderLeftColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Select text while reading to save highlights
                  </div>
                ) : (
                  highlights.map((h, i) => (
                    <div key={h.id || i} className="highlight-item">{h.text}</div>
                  ))
                )}
              </>
            )}
          </main>
        </div>

        {/* AI Panel */}
        <div className={`ai-panel ${showAI ? 'open' : ''}`}>
          <div className="ai-header">
            <span className="ai-title">Kapul AI</span>
            <button className="close-btn" onClick={() => setShowAI(false)}>×</button>
          </div>

          {selectedText && (
            <div className="selected-box">
              {selectedText.length > 150 ? selectedText.slice(0, 150) + '...' : selectedText}
            </div>
          )}

          <div className="ai-actions">
            <button className="ai-btn" onClick={() => handleAI('explain')}>Explain</button>
            <button className="ai-btn" onClick={() => handleAI('solve')}>Solve</button>
            <button className="ai-btn" onClick={handleSaveHighlight}>Save</button>
            <button className="ai-btn" onClick={handleGenerateFlashcards}>Cards</button>
          </div>

          {isLoading ? (
            <div className="loading">Thinking...</div>
          ) : aiResponse && (
            <div className="ai-response" dangerouslySetInnerHTML={{ __html: formatAIResponse(aiResponse) }} />
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay" onClick={handleCloseSettings}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Settings</span>
                <button className="close-btn" onClick={handleCloseSettings}>×</button>
              </div>

              <div className="form-group">
                <label className="form-label">AI Service Status</label>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: apiConfigured ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${apiConfigured ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: apiConfigured ? '#22c55e' : '#ef4444',
                    fontWeight: '500'
                  }}>
                    <span style={{ fontSize: '18px' }}>{apiConfigured ? '●' : '○'}</span>
                    {apiConfigured ? 'Connected' : 'Not Configured'}
                  </div>
                  {apiConfigured && apiModel && (
                    <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Model: {apiModel}
                    </div>
                  )}
                </div>
                <div className="form-hint">
                  {apiConfigured
                    ? 'AI features are enabled. Explanations, quizzes, and flashcards are available.'
                    : 'API key not configured on server. Contact your administrator to enable AI features.'}
                </div>
              </div>

              <button className="btn-primary" onClick={handleCloseSettings}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Toasts */}
        {uploadProgress && <div className="toast progress">{uploadProgress}</div>}
        {uploadError && <div className="toast error">{uploadError}</div>}
      </div>
    </>
  );
}
