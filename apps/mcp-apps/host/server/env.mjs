import { existsSync, readFileSync } from 'node:fs'

/** Loads KEY=value lines into process.env without overriding variables already set. */
export function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.trim().startsWith('#')) continue
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
    if (process.env[match[1]] === undefined) process.env[match[1]] = value
  }
}
