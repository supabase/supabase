import { describe, expect, it } from 'vitest'

import { isCrossOriginRequest } from './cross-origin'

const request = (method: string, headers: Record<string, string> = {}) =>
  new Request('http://studio:3000/api/platform/pg-meta/default/query', { method, headers })

describe('isCrossOriginRequest', () => {
  it.each(['GET', 'HEAD', 'OPTIONS'])('allows %s from another site', (method) => {
    const req = request(method, { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' })
    expect(isCrossOriginRequest(req)).toBe(false)
  })

  describe('with Sec-Fetch-Site', () => {
    it.each(['cross-site', 'same-site'])('blocks a POST marked %s', (site) => {
      expect(isCrossOriginRequest(request('POST', { 'sec-fetch-site': site }))).toBe(true)
    })

    it.each(['PUT', 'PATCH', 'DELETE'])('blocks a cross-site %s', (method) => {
      expect(isCrossOriginRequest(request(method, { 'sec-fetch-site': 'cross-site' }))).toBe(true)
    })

    it.each(['same-origin', 'none'])('allows a POST marked %s', (site) => {
      expect(isCrossOriginRequest(request('POST', { 'sec-fetch-site': site }))).toBe(false)
    })

    it('trusts it over an Origin that a proxy made look foreign', () => {
      const req = request('POST', {
        'sec-fetch-site': 'same-origin',
        origin: 'https://studio.example.com',
        host: 'studio:3000',
      })
      expect(isCrossOriginRequest(req)).toBe(false)
    })
  })

  describe('without Sec-Fetch-Site', () => {
    it('allows requests without Origin, such as curl or scripts', () => {
      expect(isCrossOriginRequest(request('POST'))).toBe(false)
    })

    it('allows an Origin that matches Host', () => {
      const req = request('POST', { origin: 'http://localhost:8000', host: 'localhost:8000' })
      expect(isCrossOriginRequest(req)).toBe(false)
    })

    it('blocks an Origin that differs from Host', () => {
      const req = request('POST', { origin: 'https://evil.example', host: 'localhost:8000' })
      expect(isCrossOriginRequest(req)).toBe(true)
    })

    // Headers as each gateway forwards them to Studio
    it.each([
      ['Envoy', { host: 'localhost:8000', 'x-forwarded-host': 'localhost:8000' }],
      [
        'Kong',
        { host: 'studio:3000', 'x-forwarded-host': 'localhost', 'x-forwarded-port': '8000' },
      ],
    ])('compares against the host the browser asked for behind %s', (_, headers) => {
      const from = (origin: string) => isCrossOriginRequest(request('POST', { ...headers, origin }))
      expect(from('http://localhost:8000')).toBe(false)
      expect(from('https://evil.example')).toBe(true)
      expect(from('http://studio:3000')).toBe(true)
    })

    it('uses the first X-Forwarded-Host when proxies are chained', () => {
      const req = request('POST', {
        origin: 'https://studio.example.com',
        'x-forwarded-host': 'studio.example.com, kong:8000',
      })
      expect(isCrossOriginRequest(req)).toBe(false)
    })

    it('blocks an opaque origin', () => {
      expect(
        isCrossOriginRequest(request('POST', { origin: 'null', host: 'localhost:8000' }))
      ).toBe(true)
    })
  })
})
