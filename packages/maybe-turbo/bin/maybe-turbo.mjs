#!/usr/bin/env node
// Runs a package script as a turbo task, so `pnpm run <script>` gets the task's `dependsOn`
// prerequisites and caching without pnpm pre/post hooks.
//
//   "build": "maybe-turbo next build --webpack"
//
// Outside turbo, it re-invokes the script as `turbo run <script> --filter=<package>`. Inside
// turbo (TURBO_HASH is set), it runs the wrapped command directly. Args appended to the script
// (`pnpm run embeddings --refresh`) are forwarded either way.
//
// Compound commands go in a single quoted argument:
//
//   "typecheck": "maybe-turbo \"next typegen && tsc --noEmit\""
//
// With no command, the script does nothing inside turbo, which suits tasks that only group
// dependencies.

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const SELF = 'maybe-turbo'

const {
  npm_lifecycle_event: task,
  npm_package_json: packageJsonPath,
  npm_package_name: packageName,
} = process.env

if (!task || !packageJsonPath || !packageName) {
  fail('run it from a package.json script, for example `pnpm run build`.')
}

const script = JSON.parse(readFileSync(packageJsonPath, 'utf8')).scripts?.[task]
if (typeof script !== 'string') fail(`couldn't find the "${task}" script in ${packageJsonPath}.`)

// pnpm appends extra CLI args to the script, so the args this script declares are the leading
// ones and anything after them came from the caller.
const ownArgCount = countOwnArgs(script)
const args = process.argv.slice(2)
const command = args.slice(0, ownArgCount)
const extraArgs = args.slice(ownArgCount)

if (process.env.TURBO_HASH) {
  if (command.length === 0) process.exit(0)
  if (command.length === 1 && /\s/.test(command[0])) {
    run([command[0], ...extraArgs.map(quote)].join(' '), [], { shell: true })
  } else {
    run(command[0], [...command.slice(1), ...extraArgs], { shell: process.platform === 'win32' })
  }
} else {
  const passThrough = extraArgs.length > 0 ? ['--', ...extraArgs] : []
  run('turbo', ['run', task, `--filter=${packageName}`, ...passThrough], {
    shell: process.platform === 'win32',
  })
}

function run(file, fileArgs, options) {
  const child = spawn(file, fileArgs, { stdio: 'inherit', ...options })
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => child.kill(signal))
  }
  child.on('error', (error) => fail(error.message))
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 1)
  })
}

function countOwnArgs(scriptText) {
  const tokens = tokenize(scriptText)
  const selfIndex = tokens.findIndex((token) => /(^|\/)maybe-turbo(\.mjs)?$/.test(token.value))
  if (selfIndex === -1) fail(`the "${task}" script doesn't call ${SELF}.`)
  const own = tokens.slice(selfIndex + 1)
  const operator = [...tokens.slice(0, selfIndex), ...own].find((token) => token.operator)
  if (operator) {
    fail(
      `the "${task}" script has "${operator.value}" outside the wrapped command. Put compound commands in one quoted argument.`
    )
  }
  return own.length
}

// Minimal POSIX-style word splitting: whitespace separates words, quotes group them, and
// unquoted &&, ||, ;, | are reported as operators.
function tokenize(text) {
  const tokens = []
  let current = null
  let quote = null
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quote) {
      if (char === quote) quote = null
      else if (char === '\\' && quote === '"' && i + 1 < text.length) current.value += text[++i]
      else current.value += char
    } else if (/\s/.test(char)) {
      if (current) tokens.push(current)
      current = null
    } else if (/[;&|]/.test(char)) {
      if (current) tokens.push(current)
      const value = /[&|]/.test(char) && text[i + 1] === char ? char + text[++i] : char
      tokens.push({ value, operator: true })
      current = null
    } else {
      current ??= { value: '' }
      if (char === '"' || char === "'") quote = char
      else if (char === '\\' && i + 1 < text.length) current.value += text[++i]
      else current.value += char
    }
  }
  if (current) tokens.push(current)
  return tokens
}

function quote(arg) {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`
}

function fail(message) {
  console.error(`${SELF}: ${message}`)
  process.exit(1)
}
