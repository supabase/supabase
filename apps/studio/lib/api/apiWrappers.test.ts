import type { JwtPayload } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResponseError } from 'types'
import apiWrapper from './apiWrapper'
import { apiAuthenticate } from './apiAuthenticate'

vi.mock('lib/constants', () => ({
  IS_PLATFORM: true,
  API_URL: 'https://api.example.com',
}))

vi.mock('./apiAuthenticate', () => ({
  apiAuthenticate: vi.fn(),
}))

describe('apiWrapper', () => {
  const mockReq = {} as NextApiRequest
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse
  const mockHandler = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call handler directly when withAuth is false', async () => {
    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: false })
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, undefined)
    expect(apiAuthenticate).not.toHaveBeenCalled()
  })

  it('should pass JWT claims to handler when withAuth is true', async () => {
    const mockClaims: JwtPayload = {
      iss: 'supabase',
      sub: 'user-123',
      aud: 'authenticated',
      exp: 9999999999,
      iat: 1000000000,
      role: 'authenticated',
      aal: 'aal1',
      session_id: 'session-123',
    }
    vi.mocked(apiAuthenticate).mockResolvedValue(mockClaims)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })
    expect(apiAuthenticate).toHaveBeenCalledWith(mockReq, mockRes)
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockClaims)
  })

  it('should return 401 when authentication fails', async () => {
    const mockError = { error: new ResponseError('Invalid token') }
    vi.mocked(apiAuthenticate).mockResolvedValue(mockError)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockHandler).not.toHaveBeenCalled()
  })
})
