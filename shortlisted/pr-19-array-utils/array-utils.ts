/**
 * Array and collection utilities for the Studio dashboard.
 * Provides helpers for array manipulation, grouping, and aggregation.
 */

/**
 * Get the first element of an array.
 */
export function first<T>(arr: T[]): T {
  return arr[0]
}

/**
 * Get the last element of an array.
 */
export function last<T>(arr: T[]): T {
  return arr[arr.length - 1]
}

/**
 * Calculate the sum of numbers in an array.
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}

/**
 * Calculate the average of numbers in an array.
 */
export function average(numbers: number[]): number {
  return sum(numbers) / numbers.length
}

/**
 * Find the minimum value in an array.
 */
export function min(numbers: number[]): number {
  return Math.min(...numbers)
}

/**
 * Find the maximum value in an array.
 */
export function max(numbers: number[]): number {
  return Math.max(...numbers)
}

/**
 * Group array items by a key.
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  
  for (const item of items) {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  }
  
  return groups
}

/**
 * Count items by a key.
 */
export function countBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, number> {
  const counts: Record<string, number> = {}
  
  for (const item of items) {
    const key = keyFn(item)
    counts[key] = (counts[key] || 0) + 1
  }
  
  return counts
}

/**
 * Get unique values from an array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

/**
 * Get unique values by a key function.
 */
export function uniqueBy<T>(arr: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set()
  return arr.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Chunk an array into smaller arrays.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Flatten a nested array one level.
 */
export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), [])
}

/**
 * Partition array into two based on predicate.
 */
export function partition<T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []
  
  for (const item of arr) {
    if (predicate(item)) {
      pass.push(item)
    } else {
      fail.push(item)
    }
  }
  
  return [pass, fail]
}

/**
 * Find index of item matching predicate, starting from end.
 */
export function findLastIndex<T>(
  arr: T[],
  predicate: (item: T) => boolean
): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return i
    }
  }
  return -1
}

/**
 * Remove item at index (mutates array).
 */
export function removeAt<T>(arr: T[], index: number): T {
  return arr.splice(index, 1)[0]
}

/**
 * Insert item at index (mutates array).
 */
export function insertAt<T>(arr: T[], index: number, item: T): void {
  arr.splice(index, 0, item)
}

/**
 * Swap two items in array (mutates array).
 */
export function swap<T>(arr: T[], i: number, j: number): void {
  const temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}

/**
 * Move item from one index to another (mutates array).
 */
export function move<T>(arr: T[], from: number, to: number): void {
  const item = arr.splice(from, 1)[0]
  arr.splice(to, 0, item)
}

/**
 * Check if arrays are equal (shallow comparison).
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Get intersection of two arrays.
 */
export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(item => setB.has(item))
}

/**
 * Get difference of two arrays (items in a but not in b).
 */
export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(item => !setB.has(item))
}

/**
 * Get symmetric difference of two arrays.
 */
export function symmetricDifference<T>(a: T[], b: T[]): T[] {
  return [...difference(a, b), ...difference(b, a)]
}

/**
 * Zip two arrays together.
 */
export function zip<A, B>(a: A[], b: B[]): [A, B][] {
  const length = Math.min(a.length, b.length)
  const result: [A, B][] = []
  for (let i = 0; i < length; i++) {
    result.push([a[i], b[i]])
  }
  return result
}

/**
 * Range of numbers from start to end.
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = []
  for (let i = start; i < end; i += step) {
    result.push(i)
  }
  return result
}

/**
 * Shuffle array (Fisher-Yates algorithm).
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Sample n random items from array.
 */
export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/**
 * Get a random item from array.
 */
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Sort array by key in ascending order.
 */
export function sortBy<T>(arr: T[], keyFn: (item: T) => number | string): T[] {
  return [...arr].sort((a, b) => {
    const keyA = keyFn(a)
    const keyB = keyFn(b)
    if (keyA < keyB) return -1
    if (keyA > keyB) return 1
    return 0
  })
}

/**
 * Sort array by key in descending order.
 */
export function sortByDesc<T>(arr: T[], keyFn: (item: T) => number | string): T[] {
  return [...arr].sort((a, b) => {
    const keyA = keyFn(a)
    const keyB = keyFn(b)
    if (keyA > keyB) return -1
    if (keyA < keyB) return 1
    return 0
  })
}

/**
 * Check if array is sorted in ascending order.
 */
export function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false
  }
  return true
}

/**
 * Binary search for value in sorted array.
 * Returns index if found, -1 otherwise.
 */
export function binarySearch(arr: number[], target: number): number {
  let left = 0
  let right = arr.length - 1
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }
  
  return -1
}

/**
 * Compact array by removing falsy values.
 */
export function compact<T>(arr: (T | null | undefined | false | 0 | '')[]): T[] {
  return arr.filter(Boolean) as T[]
}

/**
 * Create object from array of key-value pairs.
 */
export function fromPairs<V>(pairs: [string, V][]): Record<string, V> {
  const result: Record<string, V> = {}
  for (const [key, value] of pairs) {
    result[key] = value
  }
  return result
}

/**
 * Convert object to array of key-value pairs.
 */
export function toPairs<V>(obj: Record<string, V>): [string, V][] {
  return Object.entries(obj)
}

/**
 * Pick specific keys from object.
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from object.
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}

/**
 * Deep clone an object or array.
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object).
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
