import { existsSync, readdirSync, rmSync, statSync } from 'fs'
import { join } from 'path'

// This script cleans up the Turbopack cache by removing files that haven't been modified in the last 3 days. This is to
// prevent the cache from growing indefinitely and consuming too much RAM.
const dir = '.next/dev/cache/turbopack'
const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds

function clean(d) {
  if (!existsSync(d)) return
  for (const entry of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, entry.name)
    if (entry.isDirectory()) {
      clean(p)
    } else if (statSync(p).mtimeMs < cutoff) {
      rmSync(p)
    }
  }
}

clean(dir)
