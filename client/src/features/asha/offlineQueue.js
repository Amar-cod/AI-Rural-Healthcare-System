import { openDB } from 'idb';

const DB_NAME = 'rhcs-asha-db';
const STORE_NAME = 'offline-queue';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const enqueueRequest = async (request) => {
  const db = await initDB();
  // request should have { type, url, method, data, headers }
  // Since File/Blob cannot be JSON stringified, idb handles storing Blobs well natively in IndexedDB!
  await db.add(STORE_NAME, request);
};

export const getQueue = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const removeFromQueue = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const getQueueCount = async () => {
  const db = await initDB();
  return db.count(STORE_NAME);
};

// Listeners for queue change
const listeners = new Set();
export const subscribeToQueue = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifyQueueChange = async () => {
  const count = await getQueueCount();
  listeners.forEach(l => l(count));
};

// Wrap enqueue to notify
export const queueOfflineRequest = async (request) => {
  await enqueueRequest(request);
  await notifyQueueChange();
};

export const syncQueue = async (api) => {
  if (!navigator.onLine) return;
  const queue = await getQueue();
  if (queue.length === 0) return 0;
  
  let synced = 0;
  // Map to store tempId -> realId translations
  const idMap = new Map();

  for (const item of queue) {
    try {
      let payload = item.data;
      let headers = item.headers || {};
      let url = item.url;

      // Replace any temp IDs in the URL with real IDs from previous requests
      for (const [tempId, realId] of idMap.entries()) {
        url = url.replace(tempId, realId);
      }
      
      // If it's a FormData representation, reconstruct it
      if (item.isFormData) {
        payload = new FormData();
        for (const [key, value] of Object.entries(item.data)) {
          payload.append(key, value);
        }
        delete headers['Content-Type']; 
      }
      
      const res = await api({
        method: item.method,
        url: url,
        data: payload,
        headers: headers
      });
      
      // If this was a patient registration, save the mapping
      if (item.method === 'POST' && url === '/asha/patients' && res.data?.patient?._id) {
        idMap.set(item.tempId, res.data.patient._id);
      }
      
      await removeFromQueue(item.id);
      synced++;
    } catch (err) {
      console.error('Failed to sync queue item:', item, err);
      break; 
    }
  }
  
  await notifyQueueChange();
  return synced;
};
