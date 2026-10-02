import { performance } from 'node:perf_hooks'
import {
  assertPolicyConditionsSatisfied,
  getContentLengthRange,
  Policy,
  parsePolicy,
} from './policy'

describe('POST policy conditions', () => {
  it('rejects a Content-Type list when any value violates a starts-with condition', () => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$Content-Type', 'image/']],
    }

    expect(() =>
      assertPolicyConditionsSatisfied(policy, {
        'content-type': 'image/png,text/plain',
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'AccessDenied',
      })
    )
  })

  it('accepts a Content-Type list when every value satisfies a starts-with condition', () => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$Content-Type', 'image/']],
    }

    expect(() =>
      assertPolicyConditionsSatisfied(policy, {
        'content-type': 'image/png,image/gif',
      })
    ).not.toThrow()
  })

  it.each([
    'image/png, image/gif',
    'image/png,',
  ])('accepts Content-Type list %j like S3: members are trimmed, trailing empty members ignored', (contentType) => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$Content-Type', 'image/']],
    }

    expect(() =>
      assertPolicyConditionsSatisfied(policy, { 'content-type': contentType })
    ).not.toThrow()
  })

  it.each([
    'image/png,,image/gif',
    'image/png, ,image/gif',
    ',image/png',
    'image/png, ',
    'image/png , ',
    'image/png, ,',
    '',
    ' ',
  ])('rejects Content-Type list %j like S3: empty or whitespace-only members fail', (contentType) => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$Content-Type', 'image/']],
    }

    expect(() =>
      assertPolicyConditionsSatisfied(policy, { 'content-type': contentType })
    ).toThrowError(
      expect.objectContaining({
        code: 'AccessDenied',
      })
    )
  })

  // S3 accepts a lone comma (zero members, vacuous match) and stores "," as the
  // Content-Type. Deliberate deviation: keep the starts-with guarantee instead.
  it('rejects a Content-Type of only commas', () => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$Content-Type', 'image/']],
    }

    expect(() => assertPolicyConditionsSatisfied(policy, { 'content-type': ',' })).toThrowError(
      expect.objectContaining({
        code: 'AccessDenied',
      })
    )
  })

  it.each([
    'image/png,image/png',
    'image/png,',
    'image/png, image/png',
    ' image/png',
  ])('rejects Content-Type %j under an eq condition like S3: eq never splits lists', (contentType) => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['eq', '$Content-Type', 'image/png']],
    }

    expect(() =>
      assertPolicyConditionsSatisfied(policy, { 'content-type': contentType })
    ).toThrowError(
      expect.objectContaining({
        code: 'AccessDenied',
      })
    )
  })

  it('rejects a long invalid Content-Type list without blocking on trailing-comma matching', () => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$Content-Type', 'image/']],
    }
    const contentType = `image/png${','.repeat(80_000)}text/plain`

    const startedAt = performance.now()
    expect(() =>
      assertPolicyConditionsSatisfied(policy, {
        'content-type': contentType,
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'AccessDenied',
      })
    )

    expect(performance.now() - startedAt).toBeLessThan(500)
  })

  it('continues treating commas in other fields as ordinary string content', () => {
    const policy: Policy = {
      expiration: '2099-01-01T00:00:00Z',
      conditions: [['starts-with', '$key', 'folder,a/']],
    }

    expect(() =>
      assertPolicyConditionsSatisfied(policy, {
        key: 'folder,a/object.txt',
      })
    ).not.toThrow()
  })
})

describe('POST policy content-length-range', () => {
  const policyWith = (...conditions: Policy['conditions']): Policy => ({
    expiration: '2099-01-01T00:00:00Z',
    conditions,
  })

  it('returns the range a policy allows', () => {
    expect(getContentLengthRange(policyWith(['content-length-range', 10, 100]))).toEqual({
      min: 10,
      max: 100,
    })
  })

  it('accepts a range whose minimum equals its maximum', () => {
    expect(getContentLengthRange(policyWith(['content-length-range', 10, 10]))).toEqual({
      min: 10,
      max: 10,
    })
  })

  it('returns undefined when the policy sets no range', () => {
    expect(getContentLengthRange(policyWith({ bucket: 'b' }))).toBeUndefined()
  })

  it('uses the last range when several are given', () => {
    expect(
      getContentLengthRange(
        policyWith(['content-length-range', 10, 100], ['content-length-range', 50, 200])
      )
    ).toEqual({ min: 50, max: 200 })
  })

  it('accepts bounds given as numeric strings', () => {
    expect(getContentLengthRange(policyWith(['content-length-range', '10', '100']))).toEqual({
      min: 10,
      max: 100,
    })
  })

  it('matches the operator case-insensitively', () => {
    const policy = policyWith(['Content-Length-Range', 10, 100])
    expect(() => assertPolicyConditionsSatisfied(policy, {})).not.toThrow()
    expect(getContentLengthRange(policy)).toEqual({ min: 10, max: 100 })
  })

  it.each([
    ['an array operator', [['content-length-range'], 10, 100]],
    ['an array minimum', ['content-length-range', [10], 100]],
    ['an array maximum', ['content-length-range', 10, [100]]],
    ['an object operator', [{}, 10, 100]],
    ['an object minimum', ['content-length-range', {}, 100]],
    ['a null minimum', ['content-length-range', null, 100]],
    ['a boolean maximum', ['content-length-range', 10, true]],
  ])('rejects %s in a decoded JSON policy', (_, condition) => {
    const policy = parsePolicy(
      Buffer.from(
        JSON.stringify({ expiration: '2099-01-01T00:00:00Z', conditions: [condition] })
      ).toString('base64')
    )

    expect(() => assertPolicyConditionsSatisfied(policy, {})).toThrowError(
      expect.objectContaining({ code: 'InvalidSignature' })
    )
  })

  it.each([
    ['a negative minimum', ['content-length-range', -1, 100]],
    ['a minimum above the maximum', ['content-length-range', 100, 10]],
    ['a non-integer bound', ['content-length-range', 1.5, 100]],
    ['a non-numeric string bound', ['content-length-range', 'ten', 100]],
    ['an exponent string bound', ['content-length-range', '1e2', 100]],
    ['a missing bound', ['content-length-range', 10]],
  ])('rejects a range with %s', (_, condition) => {
    expect(() => assertPolicyConditionsSatisfied(policyWith(condition), {})).toThrowError(
      expect.objectContaining({ code: 'InvalidSignature' })
    )
  })
})
