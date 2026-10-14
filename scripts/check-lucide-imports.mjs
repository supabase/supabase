#!/usr/bin/env node
/**
 * Report lucide-react named imports that do not exist in the installed package.
 * Usage: node scripts/check-lucide-imports.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const pkgDir = fs.realpathSync(path.join(process.cwd(), 'packages/ui/node_modules/lucide-react'))
const version = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version
const dts = fs.readFileSync(path.join(pkgDir, 'dist/lucide-react.d.ts'), 'utf8')
const exportLine = dts.split('\n').find((l) => l.startsWith('export { '))
const names = new Set()
for (const part of exportLine
  .replace(/^export \{/, '')
  .replace(/\};?\s*$/, '')
  .split(',')) {
  const m = part.trim().match(/^(?:(\w+)\s+as\s+)?(\w+)$/)
  if (m) names.add(m[2])
}
for (const m of dts.matchAll(/^declare function (\w+)/gm)) names.add(m[1])
for (const m of dts.matchAll(/^declare const (\w+)/gm)) names.add(m[1])
for (const m of dts.matchAll(/^export type \{([^}]+)\}/gm)) {
  for (const t of m[1].split(',')) names.add(t.trim())
}

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage'])
const files = []
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const f = path.join(d, e.name)
    if (e.isDirectory()) walk(f)
    else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(f)
  }
}
for (const r of ['apps', 'packages', 'blocks', 'examples']) {
  if (fs.existsSync(r)) walk(r)
}

const missing = []
const importRe = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  importRe.lastIndex = 0
  let m
  while ((m = importRe.exec(src))) {
    for (const part of m[1].split(',')) {
      let p = part.trim()
      if (!p) continue
      p = p.replace(/^type\s+/, '')
      const name = p.split(/\s+as\s+/)[0].trim()
      if (!names.has(name)) {
        missing.push({ file: path.relative(process.cwd(), file), name })
      }
    }
  }
}

console.log(`lucide-react@${version}`)
console.log(`Unresolved imports: ${missing.length}`)
for (const m of missing) console.log(`${m.file}: ${m.name}`)
process.exit(missing.length ? 1 : 0)
