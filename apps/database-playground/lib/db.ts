import { PGlite } from '@electric-sql/pglite'

// React's double-rendering in dev mode causes pglite errors
// Temp: storing singleton instance in module scope
// TODO: get working in WebWorkers
export let db: PGlite = new PGlite('idb://local')
