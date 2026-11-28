
// ======================================================
// HAVEN - INDEXEDDB STORAGE
// Stores journal entries, moods, tiles and reflections.
// Migrates existing localStorage data on first launch.
// ======================================================

const HavenStorage = (() => {
  const DB_NAME = "HavenDatabase";
  const DB_VERSION = 1;
  const STORE_NAME = "appData";

  let db;

  const legacyKeys = ["entries", "moods", "tiles", "reflection"];

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not supported by this browser."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, {
            keyPath: "key"
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function get(key) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : undefined);
      };

      request.onerror = () => reject(request.error);
    });
  }

  function set(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      store.put({
        key,
        value
      });

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function remove(key) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      store.delete(key);

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function migrateOldData() {
    for (const key of legacyKeys) {
      const existingData = await get(key);

      // Do not overwrite data already saved in IndexedDB.
      if (existingData !== undefined) continue;

      const oldValue = localStorage.getItem("haven-" + key);

      if (oldValue === null) continue;

      try {
        const parsedValue = JSON.parse(oldValue);
        await set(key, parsedValue);
      } catch (error) {
        console.warn("Could not migrate old Haven data:", key, error);
      }
    }
  }

  async function init() {
    db = await openDatabase();
    await migrateOldData();

    // Add starter board tiles only for a new installation.
    const existingTiles = await get("tiles");

    if (existingTiles === undefined) {
      await set("tiles", [
        {
          text: "I can take things one step at a time.",
          emoji: "🌱",
          tag: "a gentle reminder"
        },
        {
          text: "Make room for the things that make me feel like me.",
          emoji: "🌈",
          tag: "a little intention"
        },
        {
          text: "Rest is part of the plan.",
          emoji: "☁️",
          tag: "a soft truth"
        }
      ]);
    }

    return true;
  }

  return {
    init,
    get,
    set,
    remove
  };
})();
