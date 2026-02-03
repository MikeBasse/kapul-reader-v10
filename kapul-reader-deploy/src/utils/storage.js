// Storage utility for persistent data using IndexedDB with localStorage fallback

const DB_NAME = 'KapulReaderDB';
const DB_VERSION = 1;

// Storage keys
export const STORAGE_KEYS = {
  BOOKS: 'kapul_books',
  HIGHLIGHTS: 'kapul_highlights',
  READING_PROGRESS: 'kapul_progress',
  FLASHCARDS: 'kapul_flashcards',
  QUIZ_SCORES: 'kapul_quiz_scores',
  SETTINGS: 'kapul_settings',
  CURRENT_BOOK: 'kapul_current_book'
};

// Initialize IndexedDB
let db = null;

export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available, falling back to localStorage');
      resolve(null);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object stores
      if (!database.objectStoreNames.contains('books')) {
        const bookStore = database.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('title', 'title', { unique: false });
        bookStore.createIndex('dateAdded', 'dateAdded', { unique: false });
      }

      if (!database.objectStoreNames.contains('highlights')) {
        const highlightStore = database.createObjectStore('highlights', { keyPath: 'id', autoIncrement: true });
        highlightStore.createIndex('bookId', 'bookId', { unique: false });
      }

      if (!database.objectStoreNames.contains('flashcards')) {
        const flashcardStore = database.createObjectStore('flashcards', { keyPath: 'id', autoIncrement: true });
        flashcardStore.createIndex('bookId', 'bookId', { unique: false });
      }

      if (!database.objectStoreNames.contains('progress')) {
        database.createObjectStore('progress', { keyPath: 'bookId' });
      }

      if (!database.objectStoreNames.contains('fileData')) {
        database.createObjectStore('fileData', { keyPath: 'bookId' });
      }
    };
  });
}

// Generic localStorage helpers
function getFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

// Books management
export async function saveBooks(books) {
  await initDB();

  if (db) {
    const tx = db.transaction('books', 'readwrite');
    const store = tx.objectStore('books');

    // Clear and re-add all books
    await store.clear();
    for (const book of books) {
      await store.add(book);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  return saveToLocalStorage(STORAGE_KEYS.BOOKS, books);
}

export async function getBooks() {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly');
      const store = tx.objectStore('books');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  return getFromLocalStorage(STORAGE_KEYS.BOOKS, []);
}

export async function addBook(book) {
  const books = await getBooks();
  books.unshift(book);
  await saveBooks(books);
  return books;
}

export async function updateBook(bookId, updates) {
  const books = await getBooks();
  const index = books.findIndex(b => b.id === bookId);
  if (index !== -1) {
    books[index] = { ...books[index], ...updates };
    await saveBooks(books);
  }
  return books;
}

export async function deleteBook(bookId) {
  const books = await getBooks();
  const filtered = books.filter(b => b.id !== bookId);
  await saveBooks(filtered);

  // Also delete associated file data
  await deleteFileData(bookId);

  return filtered;
}

// File data storage (for PDF/EPUB binary data)
export async function saveFileData(bookId, fileData) {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fileData', 'readwrite');
      const store = tx.objectStore('fileData');
      // Clone the ArrayBuffer to avoid "detached" error after PDF.js processing
      const dataToStore = fileData instanceof ArrayBuffer ? fileData.slice(0) : fileData;
      store.put({ bookId, data: dataToStore });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // localStorage can't store large binary files, skip for fallback
  return false;
}

export async function getFileData(bookId) {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fileData', 'readonly');
      const store = tx.objectStore('fileData');
      const request = store.get(bookId);

      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  return null;
}

export async function deleteFileData(bookId) {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fileData', 'readwrite');
      const store = tx.objectStore('fileData');
      store.delete(bookId);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  return true;
}

// Highlights management
export async function saveHighlights(highlights) {
  await initDB();

  if (db) {
    const tx = db.transaction('highlights', 'readwrite');
    const store = tx.objectStore('highlights');

    await store.clear();
    for (const highlight of highlights) {
      await store.add(highlight);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  return saveToLocalStorage(STORAGE_KEYS.HIGHLIGHTS, highlights);
}

export async function getHighlights(bookId = null) {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('highlights', 'readonly');
      const store = tx.objectStore('highlights');

      if (bookId) {
        const index = store.index('bookId');
        const request = index.getAll(bookId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }
    });
  }

  const highlights = getFromLocalStorage(STORAGE_KEYS.HIGHLIGHTS, []);
  return bookId ? highlights.filter(h => h.bookId === bookId) : highlights;
}

export async function addHighlight(highlight) {
  const highlights = await getHighlights();
  const newHighlight = {
    ...highlight,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  highlights.push(newHighlight);
  await saveHighlights(highlights);
  return highlights;
}

export async function deleteHighlight(highlightId) {
  const highlights = await getHighlights();
  const filtered = highlights.filter(h => h.id !== highlightId);
  await saveHighlights(filtered);
  return filtered;
}

// Reading progress management
export async function saveProgress(bookId, progress) {
  await initDB();

  const progressData = {
    bookId,
    ...progress,
    lastRead: new Date().toISOString()
  };

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      store.put(progressData);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  const allProgress = getFromLocalStorage(STORAGE_KEYS.READING_PROGRESS, {});
  allProgress[bookId] = progressData;
  return saveToLocalStorage(STORAGE_KEYS.READING_PROGRESS, allProgress);
}

export async function getProgress(bookId) {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('progress', 'readonly');
      const store = tx.objectStore('progress');
      const request = store.get(bookId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  const allProgress = getFromLocalStorage(STORAGE_KEYS.READING_PROGRESS, {});
  return allProgress[bookId] || null;
}

// Flashcards management
export async function saveFlashcards(flashcards) {
  await initDB();

  if (db) {
    const tx = db.transaction('flashcards', 'readwrite');
    const store = tx.objectStore('flashcards');

    await store.clear();
    for (const card of flashcards) {
      await store.add(card);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  return saveToLocalStorage(STORAGE_KEYS.FLASHCARDS, flashcards);
}

export async function getFlashcards(bookId = null) {
  await initDB();

  if (db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('flashcards', 'readonly');
      const store = tx.objectStore('flashcards');

      if (bookId) {
        const index = store.index('bookId');
        const request = index.getAll(bookId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }
    });
  }

  const flashcards = getFromLocalStorage(STORAGE_KEYS.FLASHCARDS, []);
  return bookId ? flashcards.filter(f => f.bookId === bookId) : flashcards;
}

export async function addFlashcard(flashcard) {
  const flashcards = await getFlashcards();
  const newCard = {
    ...flashcard,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  flashcards.push(newCard);
  await saveFlashcards(flashcards);
  return flashcards;
}

// Quiz scores management
export function saveQuizScore(score) {
  const scores = getFromLocalStorage(STORAGE_KEYS.QUIZ_SCORES, []);
  scores.push({
    ...score,
    date: new Date().toISOString()
  });
  saveToLocalStorage(STORAGE_KEYS.QUIZ_SCORES, scores);
  return scores;
}

export function getQuizScores() {
  return getFromLocalStorage(STORAGE_KEYS.QUIZ_SCORES, []);
}

export function getAverageQuizScore() {
  const scores = getQuizScores();
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s.percentage, 0);
  return Math.round(total / scores.length);
}

// Settings management
export function saveSettings(settings) {
  return saveToLocalStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function getSettings() {
  return getFromLocalStorage(STORAGE_KEYS.SETTINGS, {
    theme: 'system',
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 1.8
  });
}

// Current book tracking
export function setCurrentBook(bookId) {
  return saveToLocalStorage(STORAGE_KEYS.CURRENT_BOOK, bookId);
}

export function getCurrentBook() {
  return getFromLocalStorage(STORAGE_KEYS.CURRENT_BOOK, null);
}

// Statistics
export async function getStudyStats() {
  const books = await getBooks();
  const highlights = await getHighlights();
  const flashcards = await getFlashcards();
  const quizScore = getAverageQuizScore();

  // Calculate total pages read (estimated from progress)
  let totalPagesRead = 0;
  for (const book of books) {
    if (book.totalPages && book.progress) {
      totalPagesRead += Math.floor((book.progress / 100) * book.totalPages);
    }
  }

  return {
    pagesRead: totalPagesRead || books.filter(b => b.progress > 0).length * 3,
    problemsSolved: Math.floor(highlights.length / 2),
    flashcards: flashcards.length,
    quizScore: quizScore || 0
  };
}
