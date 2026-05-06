import type { BreadcrumbItem } from '~/lib/breadcrumbs'
import { PROD_URL } from '~/lib/constants'

type JsonLdSchema = Record<string, unknown> | Record<string, unknown>[]

export function serializeJsonLd(schema: JsonLdSchema): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

const DOCS_ROOT: BreadcrumbItem = { name: 'Docs', url: '' }
const GUIDES_ROOT: BreadcrumbItem = { name: 'Guides', url: '/guides' }

interface BreadcrumbListSchemaInput {
  pathname: string
  chain: BreadcrumbItem[]
}

export function breadcrumbListSchema({ pathname, chain }: BreadcrumbListSchemaInput) {
  const fullChain: BreadcrumbItem[] = [DOCS_ROOT, GUIDES_ROOT, ...chain]

  const itemListElement = fullChain.map((crumb, index) => {
    const isLeaf = index === fullChain.length - 1
    const name = crumb.title ?? crumb.name
    const path = isLeaf ? pathname : crumb.url

    const listItem: Record<string, unknown> = {
      '@type': 'ListItem',
      position: index + 1,
      name,
    }
    if (path !== undefined) {
      listItem.item = path === '' ? PROD_URL : `${PROD_URL}${path}`
    }
    return listItem
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}
