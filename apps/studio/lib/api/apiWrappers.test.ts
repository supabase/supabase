import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  const mockReq = {} as any
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any
  const mockHandler = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call handler directly when withAuth is false', async () => {
    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: false })
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    expect(apiAuthenticate).not.toHaveBeenCalled()
  })

  it('should attach user to request and call handler when authentication succeeds', async () => {
    const mockUser = { id: '123', email: 'test@example.com' } as any as any
    vi.mocked(apiAuthenticate).mockResolvedValue(mockUser)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })

    expect(mockReq.user).toEqual(mockUser)
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
  })
})
