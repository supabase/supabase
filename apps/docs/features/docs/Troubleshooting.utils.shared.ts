import { createSerializer, parseAsArrayOf, parseAsString } from 'nuqs'

import type { ITroubleshootingEntry } from './Troubleshooting.utils'

export const TROUBLESHOOTING_CONTAINER_ID = 'sb-docs-troubleshooting-container'
export const TROUBLESHOOTING_DATA_ATTRIBUTES = {
  QUERY_ATTRIBUTE: 'data-sb-docs-troubleshooting',
  QUERY_VALUE_ENTRY: 'entry',
  PRODUCTS_LIST_ATTRIBUTE: 'data-products',
  KEYWORDS_LIST_ATTRIBUTE: 'data-keywords',
  ERRORS_LIST_ATTRIBUTE: 'data-errors',
  GROUP_ATTRIBUTE: 'data-troubleshooting-group',
}

export const TROUBLESHOOTING_TYPES = ['health', 'security', 'performance', 'usage'] as const
export type TroubleshootingType = (typeof TROUBLESHOOTING_TYPES)[number]
export type TroubleshootingGroupBy = 'product' | 'type'

const DIAGNOSTIC_SOURCE_TYPE: Record<string, TroubleshootingType> = {
  'security-advisor': 'security',
  'performance-advisor': 'performance',
  reports: 'usage',
  metrics: 'usage',
}

const TROUBLESHOOTING_TYPE_PRIORITY: TroubleshootingType[] = [
  'security',
  'performance',
  'usage',
  'health',
]

export function getPrimaryTroubleshootingType(sources: string[]): TroubleshootingType {
  const types = new Set(sources.map((source) => DIAGNOSTIC_SOURCE_TYPE[source] ?? 'health'))
  return TROUBLESHOOTING_TYPE_PRIORITY.find((type) => types.has(type)) ?? 'health'
}

export function formatTroubleshootingGroupLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function groupTroubleshootingEntries(
  entries: ITroubleshootingEntry[],
  groupBy: TroubleshootingGroupBy
): Array<[string, ITroubleshootingEntry[]]> {
  const groups = new Map<string, ITroubleshootingEntry[]>()
  for (const entry of entries) {
    const key =
      groupBy === 'type'
        ? getPrimaryTroubleshootingType(entry.data.diagnostic_sources)
        : entry.data.topics[0]
    const list = groups.get(key)
    if (list) {
      list.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }

  const keys =
    groupBy === 'type'
      ? TROUBLESHOOTING_TYPES.filter((type) => groups.has(type))
      : Array.from(groups.keys()).sort((a, b) => a.localeCompare(b))

  return keys.map((key) => [key, groups.get(key) ?? []])
}

export function formatError(error: NonNullable<ITroubleshootingEntry['data']['errors']>[number]) {
  return `${error.http_status_code ?? ''}${!!error.http_status_code && !!error.code ? ' ' : ''}${error.code ?? ''}`
}

export function troubleshootingEntryMatchesFilter(
  entry: Pick<HTMLElement, 'textContent' | 'getAttribute'>,
  selectedProducts: string[],
  selectedErrorCodes: string[],
  selectedTags: string[],
  searchState: string
) {
  const content = entry.textContent ?? ''
  const dataKeywords = entry.getAttribute(TROUBLESHOOTING_DATA_ATTRIBUTES.KEYWORDS_LIST_ATTRIBUTE)
  const dataProducts = entry.getAttribute(TROUBLESHOOTING_DATA_ATTRIBUTES.PRODUCTS_LIST_ATTRIBUTE)
  const dataErrors = entry.getAttribute(TROUBLESHOOTING_DATA_ATTRIBUTES.ERRORS_LIST_ATTRIBUTE)
  const keywords = dataKeywords?.split(',').filter(Boolean) ?? []
  const products = dataProducts?.split(',').filter(Boolean) ?? []
  const errors = dataErrors?.split(',').filter(Boolean) ?? []

  const productsMatch =
    selectedProducts.length === 0 || selectedProducts.some((product) => products.includes(product))
  const tagsMatch = selectedTags.length === 0 || selectedTags.some((tag) => keywords.includes(tag))
  const errorsMatch =
    selectedErrorCodes.length === 0 ||
    selectedErrorCodes.some((error) => errors.some((entryError) => entryError.includes(error)))
  const searchMatch =
    searchState === '' || content.toLowerCase().includes(searchState.toLowerCase())

  return productsMatch && errorsMatch && tagsMatch && searchMatch
}

export const troubleshootingSearchParams = {
  search: parseAsString.withDefault(''),
  products: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  errorCodes: parseAsArrayOf(parseAsString).withDefault([]),
  group: parseAsString.withDefault('product'),
}
export const serializeTroubleshootingSearchParams = createSerializer(troubleshootingSearchParams)
