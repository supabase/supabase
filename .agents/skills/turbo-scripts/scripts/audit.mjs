#!/usr/bin/env node
// Lists every turbo task a workspace package can run (its own turbo.jsonc plus the root's) and
// whether the matching package.json script is wrapped with maybe-turbo.
//
//   node .agents/skills/turbo-scripts/scripts/audit.mjs apps/docs
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: node audit.mjs <package dir>, for example apps/docs')
  process.exit(1)
}

const readJsonc = (path) =>
  existsSync(path)
    ? JSON.parse(
        readFileSync(path, 'utf8')
          .replace(/^\s*\/\/.*$/gm, '')
          .replace(/,(\s*[}\]])/g, '$1')
      )
    : { tasks: {} }

const scripts = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).scripts ?? {}
const local = readJsonc(join(dir, 'turbo.jsonc')).tasks ?? {}
const root = readJsonc('turbo.jsonc').tasks ?? {}

const rows = [...new Set([...Object.keys(local), ...Object.keys(root)])].sort().map((task) => {
  const config = { ...root[task], ...local[task] }
  const script = scripts[task]
  const deps = (config.dependsOn ?? []).filter((dep) => !dep.startsWith('^'))
  const wrapped = script?.startsWith('maybe-turbo') ?? false
  let status = 'ok'
  if (script === undefined) status = deps.length > 0 ? 'no script (aggregate?)' : 'no script'
  else if (deps.length > 0 && !wrapped) status = 'NEEDS maybe-turbo'
  return [
    task,
    local[task] ? 'package' : 'root',
    wrapped ? 'yes' : 'no',
    config.cache === false ? 'no' : 'yes',
    status,
    deps.join(', ') || '-',
  ]
})

// pnpm runs `pre<name>`/`post<name>` around `<name>`. `preinstall` is an install hook, not ordering.
const hooks = Object.keys(scripts).filter((name) => {
  const match = name.match(/^(?:pre|post)(.+)$/)
  return match && match[1] !== 'install' && scripts[match[1]] !== undefined
})

// Scripts that sequence other scripts (`pnpm a && pnpm b`, `run-p a b`) hide steps from turbo.
// An alias that calls one script with extra args or env (`pnpm run embeddings --refresh`) is fine.
const names = Object.keys(scripts)
const matchScripts = (pattern) =>
  pattern.endsWith('*')
    ? names.filter((name) => name.startsWith(pattern.slice(0, -1)))
    : names.filter((name) => name === pattern)
const scriptsCalledBy = (segment) => {
  const words = segment
    .trim()
    .split(/\s+/)
    .filter((word) => !/^\w+=/.test(word))
  if (words[0] === 'pnpm') {
    const rest = words.slice(1).filter((word) => !word.startsWith('-'))
    return matchScripts(rest[0] === 'run' ? (rest[1] ?? '') : (rest[0] ?? ''))
  }
  if (['run-p', 'run-s', 'npm-run-all'].includes(words[0])) {
    return words
      .slice(1)
      .filter((word) => !word.startsWith('-'))
      .flatMap(matchScripts)
  }
  return []
}
const chains = Object.entries(scripts)
  .map(([name, command]) => {
    const segments = command.split(/&&|\|\||;/)
    const called = [...new Set(segments.flatMap(scriptsCalledBy))].filter((other) => other !== name)
    const isAlias = segments.length === 1 && called.length === 1
    return called.length > 0 && !isAlias ? `${name} -> ${called.join(', ')}` : null
  })
  .filter(Boolean)

const orphans = Object.entries(scripts)
  .filter(([name, command]) => command.startsWith('maybe-turbo') && !local[name] && !root[name])
  .map(([name]) => name)

const header = ['task', 'defined in', 'maybe-turbo', 'cached', 'status', 'same-package deps']
const widths = header.map((_, i) => Math.max(...[header, ...rows].map((row) => row[i].length)))
for (const row of [header, ...rows])
  console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '))

if (hooks.length > 0) console.log(`\npre/post hooks to migrate: ${hooks.join(', ')}`)
if (chains.length > 0) console.log(`\nscripts that call other scripts:\n  ${chains.join('\n  ')}`)
if (orphans.length > 0)
  console.log(`\nmaybe-turbo scripts with no turbo task: ${orphans.join(', ')}`)
