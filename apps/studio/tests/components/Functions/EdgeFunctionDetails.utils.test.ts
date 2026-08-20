import { describe, expect, it } from 'vitest'

import { getEdgeFunctionErrorDocs } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails.utils'
import { DOCS_URL } from '@/lib/constants'

describe('getEdgeFunctionErrorDocs', () => {
  it('builds a documentation link from the error code header', () => {
    expect(
      getEdgeFunctionErrorDocs({ 'sb-error-code': 'UNAUTHORIZED_INVALID_JWT_FORMAT' })
    ).toEqual({
      code: 'UNAUTHORIZED_INVALID_JWT_FORMAT',
      href: `${DOCS_URL}/guides/functions/error-codes#unauthorizedinvalidjwtformat`,
    })
  })

  it('uses the same anchor format as documentation headings', () => {
    expect(getEdgeFunctionErrorDocs({ 'sb-error-code': 'WORKER_RESOURCE_LIMIT' })).toEqual({
      code: 'WORKER_RESOURCE_LIMIT',
      href: `${DOCS_URL}/guides/functions/error-codes#workerresourcelimit`,
    })
  })

  it('matches the error code header case-insensitively', () => {
    expect(getEdgeFunctionErrorDocs({ 'Sb-Error-Code': 'BOOT_ERROR' })).toEqual({
      code: 'BOOT_ERROR',
      href: `${DOCS_URL}/guides/functions/error-codes#booterror`,
    })
  })

  it('uses the first value when the header contains multiple values', () => {
    expect(getEdgeFunctionErrorDocs({ 'sb-error-code': ['WORKER_ERROR', 'BOOT_ERROR'] })).toEqual({
      code: 'WORKER_ERROR',
      href: `${DOCS_URL}/guides/functions/error-codes#workererror`,
    })
  })

  it('omits the link when the error code header is missing', () => {
    expect(getEdgeFunctionErrorDocs({})).toBeUndefined()
  })

  it.each(['', '___'])('omits the link for an unusable error code', (code) => {
    expect(getEdgeFunctionErrorDocs({ 'sb-error-code': code })).toBeUndefined()
  })
})
