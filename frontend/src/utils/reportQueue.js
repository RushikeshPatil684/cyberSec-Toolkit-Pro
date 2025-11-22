/**
 * Report Queue Utility
 * Handles offline queueing of reports using IndexedDB (preferred) or localStorage (fallback)
 */

const DB_NAME = 'cybersec_toolkit_reports';
const STORE_NAME = 'queued_reports';
const VERSION = 1;

let db = null;
let useIndexedDB = false;

/**
 * Initialize IndexedDB
 */
async function initDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.log('[reportQueue] IndexedDB not available, using localStorage');
    return false;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => {
      console.warn('[reportQueue] IndexedDB open failed, falling back to localStorage');
      resolve(false);
    };

    request.onsuccess = () => {
      db = request.result;
      useIndexedDB = true;
      console.log('[reportQueue] IndexedDB initialized');
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'client_id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Add report to queue
 */
export async function enqueueReport(reportPayload) {
  if (!reportPayload.client_id) {
    throw new Error('Report payload must include client_id');
  }

  const queuedItem = {
    ...reportPayload,
    timestamp: new Date().toISOString(),
    retry_count: 0,
  };

  const initialized = await initDB();

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(queuedItem);

      request.onsuccess = () => {
        console.log('[reportQueue] Report queued in IndexedDB:', queuedItem.client_id);
        resolve(queuedItem);
      };

      request.onerror = () => {
        console.warn('[reportQueue] IndexedDB put failed, trying localStorage');
        // Fallback to localStorage
        try {
          const queue = getLocalStorageQueue();
          queue.push(queuedItem);
          localStorage.setItem(`${DB_NAME}_${STORE_NAME}`, JSON.stringify(queue));
          resolve(queuedItem);
        } catch (e) {
          reject(e);
        }
      };
    });
  } else {
    // Use localStorage fallback
    try {
      const queue = getLocalStorageQueue();
      queue.push(queuedItem);
      localStorage.setItem(`${DB_NAME}_${STORE_NAME}`, JSON.stringify(queue));
      console.log('[reportQueue] Report queued in localStorage:', queuedItem.client_id);
      return queuedItem;
    } catch (e) {
      throw new Error(`Failed to queue report: ${e.message}`);
    }
  }
}

/**
 * Get all queued reports
 */
export async function getQueuedReports() {
  const initialized = await initDB();

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.warn('[reportQueue] IndexedDB get failed, trying localStorage');
        resolve(getLocalStorageQueue());
      };
    });
  } else {
    return getLocalStorageQueue();
  }
}

/**
 * Remove report from queue
 */
export async function dequeueReport(clientId) {
  const initialized = await initDB();

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(clientId);

      request.onsuccess = () => {
        console.log('[reportQueue] Report dequeued from IndexedDB:', clientId);
        resolve(true);
      };

      request.onerror = () => {
        console.warn('[reportQueue] IndexedDB delete failed, trying localStorage');
        try {
          const queue = getLocalStorageQueue();
          const filtered = queue.filter(item => item.client_id !== clientId);
          localStorage.setItem(`${DB_NAME}_${STORE_NAME}`, JSON.stringify(filtered));
          resolve(true);
        } catch (e) {
          reject(e);
        }
      };
    });
  } else {
    try {
      const queue = getLocalStorageQueue();
      const filtered = queue.filter(item => item.client_id !== clientId);
      localStorage.setItem(`${DB_NAME}_${STORE_NAME}`, JSON.stringify(filtered));
      return true;
    } catch (e) {
      throw new Error(`Failed to dequeue report: ${e.message}`);
    }
  }
}

/**
 * Clear all queued reports
 */
export async function clearQueue() {
  const initialized = await initDB();

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[reportQueue] Queue cleared from IndexedDB');
        resolve(true);
      };

      request.onerror = () => {
        console.warn('[reportQueue] IndexedDB clear failed, trying localStorage');
        try {
          localStorage.removeItem(`${DB_NAME}_${STORE_NAME}`);
          resolve(true);
        } catch (e) {
          reject(e);
        }
      };
    });
  } else {
    try {
      localStorage.removeItem(`${DB_NAME}_${STORE_NAME}`);
      return true;
    } catch (e) {
      throw new Error(`Failed to clear queue: ${e.message}`);
    }
  }
}

/**
 * Helper: Get queue from localStorage
 */
function getLocalStorageQueue() {
  try {
    const stored = localStorage.getItem(`${DB_NAME}_${STORE_NAME}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('[reportQueue] localStorage parse error:', e);
    return [];
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initDB().catch(console.error);
}

