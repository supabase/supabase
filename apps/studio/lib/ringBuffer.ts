export class RingBuffer<T> {
  private readonly capacity: number
  private readonly buffer: (T | undefined)[]
  private head = 0
  private tail = 0
  private size = 0

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('RingBuffer capacity must be a positive integer')
    }

    this.capacity = capacity
    this.buffer = new Array<T | undefined>(capacity).fill(undefined)
  }

  get length(): number {
    return this.size
  }

  pushBack(value: T): void {
    this.buffer[this.tail] = value

    if (this.size === this.capacity) {
      this.head = (this.head + 1) % this.capacity
    } else {
      this.size += 1
    }

    this.tail = (this.tail + 1) % this.capacity
  }

  popFront(): T | undefined {
    if (this.size === 0) {
      return undefined
    }

    const value = this.buffer[this.head]
    this.buffer[this.head] = undefined
    this.head = (this.head + 1) % this.capacity
    this.size -= 1

    return value
  }

  popBack(): T | undefined {
    if (this.size === 0) {
      return undefined
    }

    const index = (this.tail - 1 + this.capacity) % this.capacity
    const value = this.buffer[index]
    this.buffer[index] = undefined
    this.tail = index
    this.size -= 1

    return value
  }

  toArray(start?: number, end?: number): T[] {
    const len = this.size

    let startIndex = start === undefined ? 0 : Math.trunc(start)
    if (startIndex < 0) {
      startIndex = Math.max(len + startIndex, 0)
    } else {
      startIndex = Math.min(startIndex, len)
    }

    let endIndex = end === undefined ? len : Math.trunc(end)
    if (endIndex < 0) {
      endIndex = Math.max(len + endIndex, 0)
    } else {
      endIndex = Math.min(endIndex, len)
    }

    const sliceLength = Math.max(endIndex - startIndex, 0)
    const result = new Array<T>(sliceLength)

    for (let offset = 0; offset < sliceLength; offset += 1) {
      const physicalIndex = (this.head + startIndex + offset) % this.capacity
      result[offset] = this.buffer[physicalIndex] as T
    }

    return result
  }
}
