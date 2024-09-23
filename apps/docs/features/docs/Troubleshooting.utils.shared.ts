import { createSerializer, parseAsArrayOf, parseAsString } from 'nuqs'

import { ITroubleshootingEntry } from './Troubleshooting.utils'

export const TROUBLESHOOTING_CONTAINER_ID = 'sb-docs-troubleshooting-container'
export const TROUBLESHOOTING_DATA_ATTRIBUTES = {
  QUERY_ATTRIBUTE: 'data-sb-docs-troubleshooting',
  QUERY_VALUE_ENTRY: 'entry',
  PRODUCTS_LIST_ATTRIBUTE: 'data-products',
  KEYWORDS_LIST_ATTRIBUTE: 'data-keywords',
  ERRORS_LIST_ATTRIBUTE: 'data-errors',
}

export function formatError(error: ITroubleshootingEntry['data']['errors'][number]) {
  return `${error.http_status_code ?? ''}${!!error.http_status_code && !!error.code && ' '}${error.code ?? ''}`
}

export const troubleshootingSearchParams = {
  search: parseAsString.withDefault(''),
  products: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  errorCodes: parseAsArrayOf(parseAsString).withDefault([]),
}
export const serializeTroubleshootingSearchParams = createSerializer(troubleshootingSearchParams)
