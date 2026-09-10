import { describe, expect, it } from 'vitest'

import { RingBuffer } from './ringBuffer'

describe('RingBuffer', () => {
  it('follows FIFO order when popping from the front', () => {
    const buffer = new RingBuffer<number>(5)

    buffer.pushBack(1)
    buffer.pushBack(2)
    buffer.pushBack(3)

    expect(buffer.popFront()).toBe(1)
    expect(buffer.popFront()).toBe(2)
    expect(buffer.popFront()).toBe(3)
    expect(buffer.popFront()).toBeUndefined()
  })

  it('supports popping from the back', () => {
    const buffer = new RingBuffer<number>(3)

    buffer.pushBack(1)
    buffer.pushBack(2)
    buffer.pushBack(3)

    expect(buffer.popBack()).toBe(3)
    expect(buffer.popBack()).toBe(2)
    expect(buffer.popBack()).toBe(1)
    expect(buffer.popBack()).toBeUndefined()
  })

  it('drops the oldest element when full', () => {
    const buffer = new RingBuffer<number>(3)

    buffer.pushBack(1)
    buffer.pushBack(2)
    buffer.pushBack(3)
    buffer.pushBack(4)

    expect(buffer.length).toBe(3)
    expect(buffer.popFront()).toBe(2)
    expect(buffer.popFront()).toBe(3)
    expect(buffer.popFront()).toBe(4)
  })

  it('handles mixed operations correctly', () => {
    const buffer = new RingBuffer<string>(2)

    buffer.pushBack('a')
    buffer.pushBack('b')

    expect(buffer.popFront()).toBe('a')

    buffer.pushBack('c')
    buffer.pushBack('d')

    expect(buffer.length).toBe(2)
    expect(buffer.popBack()).toBe('d')
    expect(buffer.popFront()).toBe('c')
    expect(buffer.popFront()).toBeUndefined()
  })

  it('returns undefined when popping from an empty buffer', () => {
    const buffer = new RingBuffer<number>(1)

    expect(buffer.popFront()).toBeUndefined()
    expect(buffer.popBack()).toBeUndefined()
  })

  it('requires a positive integer capacity', () => {
    expect(() => new RingBuffer(0)).toThrow('positive integer')
    expect(() => new RingBuffer(-1)).toThrow('positive integer')
    expect(() => new RingBuffer(1.5 as unknown as number)).toThrow('positive integer')
  })

  it('returns the full contents in order via toArray', () => {
    const buffer = new RingBuffer<number>(5)

    buffer.pushBack(1)
    buffer.pushBack(2)
    buffer.pushBack(3)

    expect(buffer.toArray()).toEqual([1, 2, 3])
  })

  it('supports slice-style bounds for toArray', () => {
    const buffer = new RingBuffer<number>(5)

    buffer.pushBack(1)
    buffer.pushBack(2)
    buffer.pushBack(3)
    buffer.pushBack(4)

    expect(buffer.toArray(1, 3)).toEqual([2, 3])
    expect(buffer.toArray(2)).toEqual([3, 4])
  })

  it('handles negative and overflowing bounds in toArray', () => {
    const buffer = new RingBuffer<number>(4)

    buffer.pushBack(10)
    buffer.pushBack(20)
    buffer.pushBack(30)
    buffer.pushBack(40)

    expect(buffer.toArray(-2)).toEqual([30, 40])
    expect(buffer.toArray(0, -1)).toEqual([10, 20, 30])
    expect(buffer.toArray(-5, 10)).toEqual([10, 20, 30, 40])
  })

  it('returns an empty array when the slice is empty', () => {
    const buffer = new RingBuffer<number>(3)

    buffer.pushBack(1)
    buffer.pushBack(2)

    expect(buffer.toArray(5)).toEqual([])
    expect(buffer.toArray(2, 2)).toEqual([])
    expect(buffer.toArray(2, 1)).toEqual([])

    const emptyBuffer = new RingBuffer<number>(3)
    expect(emptyBuffer.toArray()).toEqual([])
    expect(emptyBuffer.toArray(1)).toEqual([])
  })

  it('returns entries in order after overwriting oldest values', () => {
    const buffer = new RingBuffer<number>(3)

    buffer.pushBack(1)
    buffer.pushBack(2)
    buffer.pushBack(3)
    buffer.pushBack(4)
    buffer.pushBack(5)

    expect(buffer.toArray()).toEqual([3, 4, 5])
    expect(buffer.toArray(1)).toEqual([4, 5])
    expect(buffer.toArray(-1)).toEqual([5])
  })
})
