#!/usr/bin/env node
/**
 * Guards against filesystem case-sensitivity hazards that CI cannot otherwise see.
 *
 * CI runs on Linux (case-sensitive); most contributors are on macOS or Windows
 * (case-insensitive). Code can therefore be correct on CI and broken on every
 * dev machine, with typecheck, lint, build and tests all passing.
 *
 * Two checks, both purely textual so they fire regardless of the host filesystem:
 *
 *   1. Self-resolving imports. A specifier like `./Admonition` inside a file
 *      named `admonition.tsx` resolves to the *directory* on Linux, but on a
 *      case-insensitive filesystem the bundler tries `./Admonition.tsx` first
 *      and lands back on the importing file. The module then re-exports itself
 *      and silently exports nothing. Write `./Admonition/index` instead.
 *
 *   2. Paths colliding only by case. Two tracked paths equal when lowercased
 *      cannot both exist in a case-insensitive checkout; one silently clobbers
 *      the other on clone.
 *
 * Usage: node scripts/check-case-hazards.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']

// Directories whose contents are generated or vendored — we don't control their
// naming and can't fix violations in them.
const IGNORED_SEGMENTS = ['node_modules', '__generated__', '.generated']

/** Every relative specifier form we need to catch: static, dynamic, and require. */
const SPECIFIER_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g, // import x from '…' / export * from '…'
  /\bimport\s*\(\s*['"]([^'"]+)['"]/g, // import('…')
  /\bimport\s+['"]([^'"]+)['"]/g, // import '…'
  /\brequire\s*\(\s*['"]([^'"]+)['"]/g, // require('…')
]

function listTrackedFiles() {
  const stdout = execFileSync('git', ['ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return stdout.split('\0').filter(Boolean)
}

function isIgnored(file) {
  return file.split('/').some((segment) => IGNORED_SEGMENTS.includes(segment))
}

function stripExtension(basename) {
  const extension = SOURCE_EXTENSIONS.find((candidate) => basename.endsWith(candidate))
  return extension ? basename.slice(0, -extension.length) : basename
}

function extractRelativeSpecifiers(source) {
  const specifiers = new Set()

  for (const pattern of SPECIFIER_PATTERNS) {
    // Patterns carry /g, so reset lastIndex before reusing them across files.
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1]
      if (specifier.startsWith('./') || specifier.startsWith('../')) {
        specifiers.add(specifier)
      }
    }
  }

  return [...specifiers]
}

/**
 * Flags a specifier that resolves back to its own importing file once the
 * filesystem stops distinguishing case. Only specifiers without a file
 * extension are at risk: given an explicit extension the resolver never appends
 * one, so it cannot land on a same-named sibling.
 */
function findSelfResolvingImports(files) {
  const violations = []

  for (const file of files) {
    if (!SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))) continue

    const source = fs.readFileSync(file, 'utf8')
    const directory = path.dirname(file)
    const ownName = stripExtension(path.basename(file)).toLowerCase()

    for (const specifier of extractRelativeSpecifiers(source)) {
      if (SOURCE_EXTENSIONS.some((extension) => specifier.endsWith(extension))) continue

      const target = path.resolve(directory, specifier)
      const isSameDirectory =
        path.dirname(target).toLowerCase() === path.resolve(directory).toLowerCase()
      const isSameName = path.basename(target).toLowerCase() === ownName

      if (isSameDirectory && isSameName) {
        violations.push({ file, specifier })
      }
    }
  }

  return violations
}

/**
 * Flags tracked paths — files and the directories leading to them — that differ
 * only by case. Git stores both happily; a case-insensitive checkout cannot.
 */
function findCaseCollisions(files) {
  const seen = new Map()
  const collisions = new Map()

  const record = (candidate) => {
    const key = candidate.toLowerCase()
    const existing = seen.get(key)

    if (existing === undefined) {
      seen.set(key, candidate)
      return
    }
    if (existing === candidate) return

    if (!collisions.has(key)) collisions.set(key, new Set([existing]))
    collisions.get(key).add(candidate)
  }

  for (const file of files) {
    record(file)

    const segments = file.split('/')
    for (let i = 1; i < segments.length; i++) {
      record(segments.slice(0, i).join('/'))
    }
  }

  return [...collisions.values()].map((paths) => [...paths].sort())
}

const files = listTrackedFiles().filter((file) => !isIgnored(file))

const selfResolvingImports = findSelfResolvingImports(files)
const caseCollisions = findCaseCollisions(files)

if (selfResolvingImports.length === 0 && caseCollisions.length === 0) {
  console.log(`✅ No case-sensitivity hazards found (${files.length} tracked files checked).`)
  process.exit(0)
}

if (selfResolvingImports.length > 0) {
  console.error('\n❌ Imports that resolve to their own file on a case-insensitive filesystem:\n')
  for (const { file, specifier } of selfResolvingImports) {
    console.error(`   ${file}`)
    console.error(`     imports '${specifier}', which matches this file's own name.`)
    console.error(`     Point at the directory index explicitly, e.g. '${specifier}/index'.\n`)
  }
}

if (caseCollisions.length > 0) {
  console.error('\n❌ Tracked paths that differ only by case:\n')
  for (const paths of caseCollisions) {
    console.error(`   ${paths.join('\n   ')}\n`)
  }
  console.error('   These cannot coexist in a case-insensitive checkout. Rename one.\n')
}

process.exit(1)
