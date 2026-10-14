#!/usr/bin/env node
/**
 * Replace Lucide Github / GithubIcon imports with GithubIcon from `ui`.
 * Lucide v1 removed brand icons; the replacement lives in packages/ui.
 *
 * Usage: node scripts/migrate-github-icon-from-lucide.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'])
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.turbo'])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (EXTS.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

function stripNamedImport(source, names) {
  const importRe = /import\s*\{([^}]*)\}\s*from\s*(['"])lucide-react\2(\s*;?)/g
  let changed = false
  const next = source.replace(importRe, (full, body, quote, semi = '') => {
    const parts = body
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    const kept = []
    let removed = false
    for (const part of parts) {
      const imported = part.split(/\s+as\s+/)[0].trim()
      if (names.has(imported)) {
        removed = true
        continue
      }
      kept.push(part)
    }
    if (!removed) return full
    changed = true
    if (kept.length === 0) return ''
    return `import { ${kept.join(', ')} } from ${quote}lucide-react${quote}${semi}`
  })
  return { source: next.replace(/\n{3,}/g, '\n\n'), changed }
}

function ensureUiGithubImport(source) {
  if (/import\s*\{[^}]*\bGithubIcon\b[^}]*\}\s*from\s*['"]ui['"]/.test(source)) {
    return source
  }
  // Prefer merging into an existing `ui` named import.
  const uiImportRe = /import\s*\{([^}]*)\}\s*from\s*(['"])ui\2(\s*;?)/
  if (uiImportRe.test(source)) {
    return source.replace(uiImportRe, (full, body, quote, semi = '') => {
      const parts = body
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      if (parts.some((p) => p.split(/\s+as\s+/)[0].trim() === 'GithubIcon')) {
        return full
      }
      parts.push('GithubIcon')
      parts.sort((a, b) => a.localeCompare(b))
      return `import { ${parts.join(', ')} } from ${quote}ui${quote}${semi}`
    })
  }

  // Insert after the last lucide-react import, or at the top of import block.
  const lucideIdx = source.lastIndexOf("from 'lucide-react'")
  const lucideIdx2 = source.lastIndexOf('from "lucide-react"')
  const idx = Math.max(lucideIdx, lucideIdx2)
  const importLine = "import { GithubIcon } from 'ui'\n"
  if (idx !== -1) {
    const lineEnd = source.indexOf('\n', idx)
    const at = lineEnd === -1 ? source.length : lineEnd + 1
    return source.slice(0, at) + importLine + source.slice(at)
  }

  const firstImport = source.search(/^import\s/m)
  if (firstImport === -1) return importLine + source
  return source.slice(0, firstImport) + importLine + source.slice(firstImport)
}

function migrateFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8')
  if (!original.includes('lucide-react')) return false
  if (!/\bGithub(Icon)?\b/.test(original)) return false

  let source = original
  // Rename bare <Github /> / Github usages that came from lucide before adding ui import.
  const hadBareGithubImport =
    /import\s*\{[^}]*\bGithub\b[^}]*\}\s*from\s*['"]lucide-react['"]/.test(source)
  const { source: withoutLucideGithub, changed: removed } = stripNamedImport(
    source,
    new Set(['Github', 'GithubIcon'])
  )
  if (!removed) return false
  source = withoutLucideGithub

  if (hadBareGithubImport) {
    // Replace remaining Github identifier usages with GithubIcon, but not GitHub words in strings/comments carefully:
    // Only JSX tags and bare identifiers that were the icon.
    source = source
      .replace(/<Github(\s|>|\/)/g, '<GithubIcon$1')
      .replace(/<\/Github>/g, '</GithubIcon>')
      .replace(/([^\w])Github([^\w])/g, (m, a, b) => {
        // Avoid rewriting GitHub (capital H) which won't match anyway.
        return `${a}GithubIcon${b}`
      })
  }

  source = ensureUiGithubImport(source)
  if (source !== original) {
    fs.writeFileSync(filePath, source)
    return true
  }
  return false
}

const roots = ['apps', 'packages', 'blocks', 'examples'].filter((d) =>
  fs.existsSync(path.join(ROOT, d))
)
let count = 0
for (const root of roots) {
  for (const file of walk(path.join(ROOT, root))) {
    if (migrateFile(file)) {
      count += 1
      console.log(path.relative(ROOT, file))
    }
  }
}
console.log(`Updated ${count} files`)
