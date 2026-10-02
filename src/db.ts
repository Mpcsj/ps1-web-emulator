// Tiny IndexedDB key/value store shared by the app (BIOS, memory cards).
// public/player.html opens the same DB/store directly; keep names in sync.

export const DB_NAME = 'sheep-raider'
const STORE = 'files'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const idbGet = <T>(key: string) => tx<T | undefined>('readonly', (s) => s.get(key))
export const idbPut = (key: string, value: unknown) => tx('readwrite', (s) => s.put(value, key))
export const idbDelete = (key: string) => tx('readwrite', (s) => s.delete(key))

// A picked file has the wrong size for what it claims to be. The UI shows its own,
// translated message from these fields.
export class WrongSizeError extends Error {
  file: string
  size: number
  constructor(file: string, size: number, expected: string) {
    super(`${file} is ${size} bytes; ${expected}.`)
    this.file = file
    this.size = size
  }
}
