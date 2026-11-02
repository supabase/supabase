import { describe, expect, it } from 'vitest'

import { getEdgeFunctionErrorDocs } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails.utils'
import { DOCS_URL } from '@/lib/constants'

describe('getEdgeFunctionErrorDocs', () => {
  it.each([
    ['UNAUTHORIZED_INVALID_JWT_FORMAT', 'unauthorizedinvalidjwtformat'],
    ['WORKER_RESOURCE_LIMIT', 'workerresourcelimit'],
  ])('builds a documentation link for %s using the docs heading anchor format', (code, anchor) => {
    expect(getEdgeFunctionErrorDocs({ 'sb-error-code': code })).toEqual({
      code,
      href: `${DOCS_URL}/guides/functions/error-codes#${anchor}`,
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
