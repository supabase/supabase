import { createRequire } from 'node:module'
import net from 'node:net'
import vm from 'node:vm'

import { render } from '@react-email/render'
import { createElement } from 'react'

const nodeRequire = createRequire(import.meta.url)

const ALLOWED_MODULES = [
  '@react-email/components',
  '@react-email/render',
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/server',
]

const preloadedModules = new Map(ALLOWED_MODULES.map((name) => [name, nodeRequire(name)]))

function restrictedRequire(specifier) {
  if (!preloadedModules.has(specifier)) {
    throw new Error(`module "${specifier}" is not available to email templates`)
  }
  return preloadedModules.get(specifier)
}

function denied(name) {
  return () => {
    throw new Error(`${name} is not available to email templates`)
  }
}

function lock(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    writable: false,
    configurable: false,
    enumerable: false,
  })
}

function hardenRuntime() {
  for (const key of ['binding', '_linkedBinding', 'dlopen', 'getBuiltinModule']) {
    lock(process, key, denied(`process.${key}`))
  }
  lock(process, 'env', Object.freeze({}))
  lock(process, 'mainModule', undefined)

  for (const key of ['fetch', 'WebSocket', 'XMLHttpRequest', 'EventSource', 'navigator']) {
    if (key in globalThis) lock(globalThis, key, undefined)
  }

  for (const key of ['connect', '_connect']) {
    lock(net.Socket.prototype, key, denied('network access'))
  }
  for (const key of ['connect', 'createConnection']) {
    lock(net, key, denied('network access'))
  }
}

function sandboxConsole() {
  const write = (...args) => console.error(...args)
  return { log: write, info: write, warn: write, error: write, debug: write }
}

function evaluateTemplate(code) {
  const module = { exports: {} }
  const context = vm.createContext(
    { module, exports: module.exports, require: restrictedRequire, console: sandboxConsole() },
    { codeGeneration: { strings: false, wasm: false } }
  )
  new vm.Script(code, { filename: 'email-template.tsx' }).runInContext(context, {
    timeout: 5_000,
  })
  return module.exports.default
}

async function renderCompiledTemplate(code, props) {
  const Component = evaluateTemplate(code)
  if (typeof Component !== 'function') {
    throw new Error('react email template must have a React component as its default export')
  }
  return render(createElement(Component, { ...props }))
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const input = await readStdin()
  const stdout = process.stdout
  hardenRuntime()
  try {
    const { code, props } = JSON.parse(input)
    if (typeof code !== 'string' || typeof props !== 'object' || props === null) {
      throw new Error('invalid render request')
    }
    const html = await renderCompiledTemplate(code, props)
    stdout.write(JSON.stringify({ html }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    stdout.write(JSON.stringify({ error: message }))
  }
}

void main()
