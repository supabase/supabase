// Shared .env parsing for the studio build/serve scripts (dispatch.js,
// serve.js). We parse the small subset of the dotenv format we actually rely
// on — `KEY=value`, an optional `export` prefix, and surrounding single/double
// quotes — rather than taking on the `dotenv` dependency for a couple of build
// scripts. Crucially, nothing here touches `process.env`: callers decide what
// to do with the parsed values, which is what lets dispatch.js read a single
// key without leaking the whole file into the child process.
//
// dispatch.js and serve.js must agree on this format, so it lives here once.
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ENV_LINE = /^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/

// Parse the contents of a single env file into a plain key/value object.
export function parseEnv(content) {
  const parsed = {}
  for (const raw of content.split('\n')) {
    const m = ENV_LINE.exec(raw)
    if (!m) continue
    let value = m[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    parsed[m[1]] = value
  }
  return parsed
}

// Read a cascade of env files from `dir`, with later files overriding earlier
// ones — matching the precedence vite/Next use
// (`.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`). A missing file
// is skipped, but any other read error (permissions, IO) is surfaced rather
// than silently dropping that file's values. Returns the merged key/value
// object; never mutates process.env.
export function readEnvFiles(dir, files) {
  const parsed = {}
  for (const file of files) {
    let content
    try {
      content = readFileSync(path.join(dir, file), 'utf8')
    } catch (err) {
      if (err && typeof err === 'object' && err.code === 'ENOENT') continue
      throw err
    }
    Object.assign(parsed, parseEnv(content))
  }
  return parsed
}
