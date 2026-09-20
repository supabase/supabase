import type { BreadcrumbItem } from '~/lib/breadcrumbs'
import { PROD_URL } from '~/lib/constants'

type JsonLdSchema = Record<string, unknown> | Record<string, unknown>[]

export function serializeJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

type ValidCrumb = BreadcrumbItem & { url: string }

const DOCS_ROOT: ValidCrumb = { name: 'Docs', url: '' }
const GUIDES_ROOT: ValidCrumb = { name: 'Guides', url: '/guides' }

interface BreadcrumbListSchemaInput {
  pathname: string
  chain: BreadcrumbItem[]
}

const warnedPaths = new Set<string>()

function isValidCrumb(crumb: BreadcrumbItem): crumb is ValidCrumb {
  return crumb.url !== undefined && Boolean(crumb.title ?? crumb.name)
}

export function breadcrumbListSchema({ pathname, chain }: BreadcrumbListSchemaInput) {
  const filteredChain = chain.filter(isValidCrumb)

  if (
    process.env.NODE_ENV !== 'production' &&
    filteredChain.length !== chain.length &&
    !warnedPaths.has(pathname)
  ) {
    warnedPaths.add(pathname)
    const dropped = chain
      .filter((crumb) => !isValidCrumb(crumb))
      .map((crumb) => crumb.title ?? crumb.name ?? '<unnamed>')
    console.warn(
      `[json-ld] Dropping breadcrumb items missing url or name from ${pathname}: ${dropped.join(', ')}`
    )
  }

  if (filteredChain.length === 0) return null

  const fullChain: ValidCrumb[] = [DOCS_ROOT, GUIDES_ROOT, ...filteredChain]

  const itemListElement = fullChain.map((crumb, index) => {
    const isLeaf = index === fullChain.length - 1
    const path = isLeaf ? pathname : crumb.url
    const itemUrl = path === '' ? PROD_URL : `${PROD_URL}${path}`

    return {
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.title ?? crumb.name,
      item: itemUrl,
    }
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}
