const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const vm = require('node:vm')

const SUPABASE_ORIGIN = 'https://supabase.com'

// Evaluated as production: the /docs rewrite only exists there, and /docs links must be flagged in every environment.
function loadProductionRewrites() {
  const rewritesModule = { exports: [] }
  const source = readFileSync(join(__dirname, '../lib/rewrites.js'), 'utf8')
  vm.runInNewContext(source, {
    module: rewritesModule,
    process: { env: { NEXT_PUBLIC_VERCEL_ENV: 'production' } },
  })
  return rewritesModule.exports
}

const crossZonePrefixes = loadProductionRewrites()
  .filter(({ destination }) => !destination.startsWith('/'))
  .map(({ source }) => source.replace(/\/(:path\*)?$/, ''))

function parseHref(href) {
  try {
    return new URL(href, SUPABASE_ORIGIN)
  } catch {
    return null
  }
}

function isCrossZonePath(href) {
  const url = parseHref(href)
  if (url?.origin !== SUPABASE_ORIGIN) return false

  return crossZonePrefixes.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
  )
}

function staticHrefPrefix(value) {
  if (!value) return null
  if (value.type === 'Literal') return typeof value.value === 'string' ? value.value : null
  if (value.type !== 'JSXExpressionContainer') return null

  const { expression } = value
  if (expression.type === 'Literal' && typeof expression.value === 'string') return expression.value
  if (expression.type === 'TemplateLiteral') return expression.quasis[0].value.cooked
  return null
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    messages: {
      crossZone:
        "'{{href}}' is served by another zone. Use a plain <a>: Next.js can't prefetch or client-navigate across zones, so <Link> 404s its prefetch.",
    },
    schema: [],
  },
  create(context) {
    const linkNames = new Set()

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'next/link') return
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier') linkNames.add(specifier.local.name)
        }
      },
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || !linkNames.has(node.name.name)) return

        const hrefAttribute = node.attributes.find(
          (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'href'
        )
        const href = staticHrefPrefix(hrefAttribute?.value)
        if (!href || !isCrossZonePath(href)) return

        context.report({ node: hrefAttribute, messageId: 'crossZone', data: { href } })
      },
    }
  },
}
