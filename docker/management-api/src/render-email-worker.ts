import { createRequire } from 'node:module'
import vm from 'node:vm'

import { render } from '@react-email/render'
import { transform } from 'esbuild'
import { createElement, type ComponentType } from 'react'

const nodeRequire = createRequire(import.meta.url)

const ALLOWED_MODULES = new Set([
  '@react-email/components',
  '@react-email/render',
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/server',
])

export const GOTRUE_TEMPLATE_PROPS = {
  confirmationURL: '{{ .ConfirmationURL }}',
  token: '{{ .Token }}',
  tokenHash: '{{ .TokenHash }}',
  siteURL: '{{ .SiteURL }}',
  email: '{{ .Email }}',
  newEmail: '{{ .NewEmail }}',
  redirectTo: '{{ .RedirectTo }}',
  data: '{{ .Data }}',
  oldEmail: '{{ .OldEmail }}',
  phone: '{{ .Phone }}',
  oldPhone: '{{ .OldPhone }}',
  provider: '{{ .Provider }}',
  factorType: '{{ .FactorType }}',
} as const

export type GoTrueTemplateProps = Record<keyof typeof GOTRUE_TEMPLATE_PROPS, string>

function restrictedRequire(specifier: string): unknown {
  if (!ALLOWED_MODULES.has(specifier)) {
    throw new Error(`module "${specifier}" is not available to email templates`)
  }
  return nodeRequire(specifier)
}

export async function renderTemplateSource(source: string): Promise<string> {
  const { code } = await transform(source, {
    loader: 'tsx',
    format: 'cjs',
    jsx: 'automatic',
    target: 'node20',
  })

  const module = { exports: {} as { default?: ComponentType<GoTrueTemplateProps> } }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: restrictedRequire,
    console,
  })
  new vm.Script(code, { filename: 'email-template.tsx' }).runInContext(context, {
    timeout: 5_000,
  })

  const Component = module.exports.default
  if (typeof Component !== 'function') {
    throw new Error('react email template must have a React component as its default export')
  }

  return render(createElement(Component, { ...GOTRUE_TEMPLATE_PROPS }))
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function main(): Promise<void> {
  const source = await readStdin()
  try {
    const html = await renderTemplateSource(source)
    process.stdout.write(JSON.stringify({ html }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stdout.write(JSON.stringify({ error: message }))
  }
}

if (process.env.EMAIL_RENDER_WORKER === '1') {
  void main()
}
