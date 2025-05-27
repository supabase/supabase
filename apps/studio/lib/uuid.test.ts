import { describe, it, expect, vi } from 'vitest'
import { v4 as _uuidV4 } from 'uuid'
import uuidv4 from './uuid'

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid'),
}))

describe('uuidv4', () => {
  it('calls uuid.v4 and returns the result', () => {
    const result = uuidv4()
    expect(_uuidV4).toHaveBeenCalled()
    expect(result).toBe('mocked-uuid')
  })
})
