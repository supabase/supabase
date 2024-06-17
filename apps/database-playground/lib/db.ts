import { PGlite } from '@electric-sql/pglite'
import { nanoid } from 'ai'

// React's `useEffect` double-rendering in dev mode causes pglite errors
// Temp: storing singleton instance in module scope
// TODO: get working in WebWorkers
export let db: PGlite
export let currentDbId: string = getDbId()

loadDb(currentDbId)

export async function loadDb(id: string) {
  db = new PGlite(`idb://${id}`)
  await db.waitReady
  return db
}

// TODO: find a way to delete more elegantly via PGlite
export async function resetDb() {
  await db.close()
  indexedDB.deleteDatabase(`/pglite/${currentDbId}`)
  currentDbId = newDbId()
  return loadDb(currentDbId)
}

export function getDbId() {
  const dbId = localStorage.getItem('current-db-id')
  return dbId ?? newDbId()
}

export function newDbId() {
  const dbId = nanoid()
  localStorage.setItem('current-db-id', dbId)
  return dbId
}
