import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiWrapper, { isResponseOk } from './apiWrapper'
import { apiAuthenticate } from './apiAuthenticate'
import { ResponseError } from 'types'
import { IS_PLATFORM } from '../constants'

vi.mock('./apiAuthenticate', () => ({
  apiAuthenticate: vi.fn(),
}))

vi.mock('../constants', () => ({
  IS_PLATFORM: true,
}))

describe('isResponseOk', () => {
  it('should return false for undefined', () => {
    expect(isResponseOk(undefined)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isResponseOk(null)).toBe(false)
  })

  it('should return false for ResponseError', () => {
    const error = new ResponseError('Error message', 500)
    expect(isResponseOk(error)).toBe(false)
  })

  it('should return false for object with error property', () => {
    expect(isResponseOk({ error: { message: 'Error' } })).toBe(false)
  })

  it('should return false for object with truthy error', () => {
    expect(isResponseOk({ error: true })).toBe(false)
  })

  it('should return true for object without error property', () => {
    expect(isResponseOk({ data: 'success' })).toBe(true)
  })

  it('should return true for object with falsy error', () => {
    expect(isResponseOk({ error: null })).toBe(true)
    expect(isResponseOk({ error: false })).toBe(true)
  })

  it('should return true for primitive values', () => {
    expect(isResponseOk('string')).toBe(true)
    expect(isResponseOk(123)).toBe(true)
    expect(isResponseOk(true)).toBe(true)
  })
})

describe('apiWrapper', () => {
  const mockReq = {} as any
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any
  const mockHandler = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(IS_PLATFORM as any) = true
  })

  it('should call handler directly when withAuth is false', async () => {
    const handlerResponse = { data: 'success' }
    mockHandler.mockResolvedValue(handlerResponse)

    const result = await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: false })

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    expect(apiAuthenticate).not.toHaveBeenCalled()
    expect(result).toBe(handlerResponse)
  })

  it('should call handler directly when withAuth is undefined', async () => {
    const handlerResponse = { data: 'success' }
    mockHandler.mockResolvedValue(handlerResponse)

    const result = await apiWrapper(mockReq, mockRes, mockHandler)

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    expect(apiAuthenticate).not.toHaveBeenCalled()
    expect(result).toBe(handlerResponse)
  })

  it('should authenticate when withAuth is true and IS_PLATFORM is true', async () => {
    const handlerResponse = { data: 'success' }
    mockHandler.mockResolvedValue(handlerResponse)
    ;(apiAuthenticate as any).mockResolvedValue({ success: true })

    const result = await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })

    expect(apiAuthenticate).toHaveBeenCalledWith(mockReq, mockRes)
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    expect(result).toBe(handlerResponse)
  })

  it('should return 401 when authentication fails', async () => {
    const authResponse = {
      error: { message: 'API error happened while trying to communicate with the server.' },
    }
    ;(apiAuthenticate as any).mockResolvedValue(authResponse)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })

    expect(apiAuthenticate).toHaveBeenCalledWith(mockReq, mockRes)
    expect(mockHandler).not.toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Unauthorized: API error happened while trying to communicate with the server.',
      },
    })
  })

  it('should not authenticate when IS_PLATFORM is false', async () => {
    ;(IS_PLATFORM as any) = false
    const handlerResponse = { data: 'success' }
    mockHandler.mockResolvedValue(handlerResponse)

    const result = await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })

    expect(apiAuthenticate).not.toHaveBeenCalled()
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    expect(result).toBe(handlerResponse)
  })

  it('should propagate handler errors (awaited promise rejection)', async () => {
    const handlerError = new Error('Handler error')
    mockHandler.mockRejectedValue(handlerError)

    // Handler errors propagate since the handler promise isn't awaited in the implementation
    await expect(apiWrapper(mockReq, mockRes, mockHandler)).rejects.toThrow('Handler error')
  })

  it('should return 500 when authentication throws an error', async () => {
    const authError = new Error('Auth error')
    ;(apiAuthenticate as any).mockRejectedValue(authError)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({ error: authError })
  })
})
