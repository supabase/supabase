import { describe, expect, it } from 'vitest'

import { authorizeMcpRequest, MCP_ACCESS_TOKEN_MIN_LENGTH } from './mcp-auth'

const configuredToken = 'a'.repeat(MCP_ACCESS_TOKEN_MIN_LENGTH)

describe('authorizeMcpRequest', () => {
  it('rejects hosted Studio before looking at the token', () => {
    const result = authorizeMcpRequest({
      isPlatform: true,
      authorizationHeader: `Bearer ${configuredToken}`,
      configuredToken,
    })

    expect(result).toEqual({ isAuthorized: false, status: 404, message: 'Not found' })
  })

  it.each([
    { label: 'undefined', configuredToken: undefined },
    { label: 'empty', configuredToken: '' },
    { label: 'whitespace', configuredToken: '   ' },
  ])('rejects a self-hosted server when the token is $label', ({ configuredToken: token }) => {
    const result = authorizeMcpRequest({
      isPlatform: false,
      authorizationHeader: `Bearer ${configuredToken}`,
      configuredToken: token,
    })

    expect(result).toMatchObject({ isAuthorized: false, status: 503 })
  })

  it('rejects a token shorter than 32 characters', () => {
    const result = authorizeMcpRequest({
      isPlatform: false,
      authorizationHeader: `Bearer ${'b'.repeat(MCP_ACCESS_TOKEN_MIN_LENGTH - 1)}`,
      configuredToken: 'b'.repeat(MCP_ACCESS_TOKEN_MIN_LENGTH - 1),
    })

    expect(result).toMatchObject({ isAuthorized: false, status: 503 })
    expect(result).toMatchObject({
      message: expect.stringContaining('at least 32 characters'),
    })
  })

  it.each([
    { label: 'missing', authorizationHeader: undefined },
    { label: 'empty', authorizationHeader: '' },
    { label: 'not bearer', authorizationHeader: `Basic ${configuredToken}` },
    { label: 'bearer without a token', authorizationHeader: 'Bearer' },
    { label: 'wrong token of the same length', authorizationHeader: `Bearer ${'b'.repeat(32)}` },
    { label: 'prefix of the token', authorizationHeader: `Bearer ${configuredToken.slice(0, 16)}` },
    { label: 'token with a suffix', authorizationHeader: `Bearer ${configuredToken}x` },
    { label: 'repeated header', authorizationHeader: [`Bearer ${configuredToken}`] },
  ])('rejects a $label credential when a token is configured', ({ authorizationHeader }) => {
    const result = authorizeMcpRequest({
      isPlatform: false,
      authorizationHeader,
      configuredToken,
    })

    expect(result).toMatchObject({ isAuthorized: false, status: 401 })
  })

  it('accepts a bearer token that matches, ignoring scheme case and surrounding whitespace', () => {
    const result = authorizeMcpRequest({
      isPlatform: false,
      authorizationHeader: `  bearer   ${configuredToken}  `,
      configuredToken: `  ${configuredToken}  `,
    })

    expect(result).toEqual({ isAuthorized: true })
  })
})
