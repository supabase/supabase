#!/usr/bin/env node
// Generates the Vercel bulk redirects file for apps/docs from lib/redirects/static-redirects.json.
//
// Every /docs/guides/ entry also gets a `.md` variant. The output is sorted by base path,
// with each base entry directly before its `.md` variant.
//
// Usage:
//   pnpm run redirects:generate
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const redirectsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'redirects')
const SOURCE_PATH = join(redirectsDir, 'static-redirects.json')
const OUTPUT_PATH = join(redirectsDir, 'generated', 'static-redirects-md-variants.json')

const source = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'))
for (const redirect of source) {
  if (typeof redirect.source !== 'string' || typeof redirect.destination !== 'string') {
    throw new Error(`Invalid entry in static-redirects.json: ${JSON.stringify(redirect)}`)
  }
  if (/[:*()]/.test(redirect.source) || 'has' in redirect || 'missing' in redirect) {
    throw new Error(`${redirect.source} is not static. Move it to dynamic-redirects.js.`)
  }
}
const sources = new Set(source.map((redirect) => redirect.source))
if (sources.size !== source.length) {
  throw new Error('Duplicate source in static-redirects.json')
}

const variants = source
  .filter((r) => r.source.startsWith('/docs/guides/') && r.destination.startsWith('/'))
  .map((r) => ({
    source: `${r.source}.md`,
    destination: `${r.destination}.md`,
    permanent: r.permanent,
  }))
for (const variant of variants) {
  if (sources.has(variant.source)) {
    throw new Error(`Remove the hand-written ${variant.source} entry. It is generated.`)
  }
}

const base = (path) => path.replace(/\.md$/, '')
const isMd = (path) => path.endsWith('.md')
const compareBase = (a, b) => (base(a) < base(b) ? -1 : base(a) > base(b) ? 1 : 0)
const output = [...source, ...variants].sort(
  (a, b) => compareBase(a.source, b.source) || Number(isMd(a.source)) - Number(isMd(b.source))
)
const json = JSON.stringify(output, null, 2) + '\n'

mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, json)
console.log(`Wrote ${OUTPUT_PATH}`)
