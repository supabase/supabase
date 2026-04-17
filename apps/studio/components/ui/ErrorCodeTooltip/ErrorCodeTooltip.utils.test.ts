import { ERROR_CODE_DOCS_URLS } from 'shared-data'
import { describe, expect, it } from 'vitest'

import { getErrorCodeInfo } from './ErrorCodeTooltip.utils'
import { Service } from '@/data/graphql/graphql'

describe('getErrorCodeInfo', () => {
  describe('when service is undefined', () => {
    it('returns no definition and no docsUrl', () => {
      const result = getErrorCodeInfo('bad_jwt', undefined)
      expect(result.definition).toBeUndefined()
      expect(result.docsUrl).toBeUndefined()
    })
  })

  describe('when service is Storage (not in shared-data)', () => {
    it('returns no definition and no docsUrl', () => {
      const result = getErrorCodeInfo('some_code', Service.Storage)
      expect(result.definition).toBeUndefined()
      expect(result.docsUrl).toBeUndefined()
    })
  })

  describe('auth service', () => {
    it('returns definition for a known error code', () => {
      const result = getErrorCodeInfo('bad_jwt', Service.Auth)
      expect(result.definition).toBeDefined()
      expect(result.definition?.description).toBeTypeOf('string')
    })

    it('returns the auth docs URL', () => {
      const result = getErrorCodeInfo('bad_jwt', Service.Auth)
      expect(result.docsUrl).toBe(ERROR_CODE_DOCS_URLS['auth'])
    })

    it('returns undefined definition for an unknown error code', () => {
      const result = getErrorCodeInfo('not_a_real_code', Service.Auth)
      expect(result.definition).toBeUndefined()
    })

    it('returns definition for a numeric HTTP error code', () => {
      const result = getErrorCodeInfo('429', Service.Auth)
      expect(result.definition).toBeDefined()
      expect(result.definition?.description).toBeTypeOf('string')
    })

    it('returns undefined for a numeric code not in HTTP_ERROR_CODES', () => {
      const result = getErrorCodeInfo('999', Service.Auth)
      expect(result.definition).toBeUndefined()
    })
  })

  describe('realtime service', () => {
    it('returns the realtime docs URL', () => {
      const result = getErrorCodeInfo('TopicNameRequired', Service.Realtime)
      expect(result.docsUrl).toBe(ERROR_CODE_DOCS_URLS['realtime'])
    })

    it('returns definition for a known realtime error code', () => {
      const result = getErrorCodeInfo('TopicNameRequired', Service.Realtime)
      expect(result.definition).toBeDefined()
      expect(result.definition?.description).toBeTypeOf('string')
    })

    it('returns undefined definition for an unknown realtime error code', () => {
      const result = getErrorCodeInfo('not_a_real_code', Service.Realtime)
      expect(result.definition).toBeUndefined()
    })
  })
})
