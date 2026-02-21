// Simple local storage using IndexedDB
// No sync state machine, just local cache

const DB_NAME = 'easy-note-local';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

let db: IDBDatabase | null = null;

async function getDb(): Promise<IDBDatabase> {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  deletedAt: number | null;
  lastSyncedAt?: number; // Optional, just for info
}

// Save note to local immediately
export async function saveLocal(note: LocalNote): Promise<void> {
  const database = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(note);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get note from local
export async function getLocal(id: string): Promise<LocalNote | null> {
  const database = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Get all notes from local
export async function getAllLocal(): Promise<LocalNote[]> {
  const database = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Delete note from local
export async function deleteLocal(id: string): Promise<void> {
  const database = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Check if local data exists (for offline detection)
export async function hasLocalData(): Promise<boolean> {
  const notes = await getAllLocal();
  return notes.length > 0;
}

// Clear all local data
export async function clearLocal(): Promise<void> {
  const database = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
