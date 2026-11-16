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

    // Without a proxy, as on a CLI stack
    it('allows an Origin that matches Host', () => {
      const req = request('POST', { origin: 'http://10.0.0.5:54323', host: '10.0.0.5:54323' })
      expect(isCrossOriginRequest(req)).toBe(false)
    })

    it('blocks the same hostname on another port', () => {
      const req = request('POST', { origin: 'http://10.0.0.5:8080', host: '10.0.0.5:54323' })
      expect(isCrossOriginRequest(req)).toBe(true)
    })

    it('blocks another site', () => {
      const req = request('POST', { origin: 'https://evil.example', host: '10.0.0.5:54323' })
      expect(isCrossOriginRequest(req)).toBe(true)
    })

    // Headers as each proxy forwards them to Studio, with the origin of the
    // page the browser loaded Studio from
    it.each([
      [
        'Envoy',
        {
          host: 'studio.test:8000',
          'x-forwarded-host': 'studio.test:8000',
          'x-forwarded-port': '8000',
        },
        'http://studio.test:8000',
      ],
      [
        'Caddy',
        { host: 'studio.test:8443', 'x-forwarded-host': 'studio.test:8443' },
        'https://studio.test:8443',
      ],
      [
        'nginx',
        { host: 'studio.test', 'x-forwarded-host': 'studio.test', 'x-forwarded-port': '443' },
        'https://studio.test',
      ],
    ])('compares against the host the browser asked for behind %s', (_, headers, studio) => {
      const from = (origin: string) => isCrossOriginRequest(request('POST', { ...headers, origin }))
      expect(from(studio)).toBe(false)
      expect(from('http://studio.test:9999')).toBe(true)
      expect(from('https://evil.example')).toBe(true)
      expect(from('http://studio:3000')).toBe(true)
    })

    // Kong rewrites Host and reports its container port, whatever port is published
    it('compares hostnames behind Kong', () => {
      const headers = {
        host: 'studio:3000',
        'x-forwarded-host': 'studio.test',
        'x-forwarded-port': '8000',
      }
      const from = (origin: string) => isCrossOriginRequest(request('POST', { ...headers, origin }))
      expect(from('http://studio.test:8000')).toBe(false)
      expect(from('http://studio.test:9000')).toBe(false)
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
