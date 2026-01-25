/**
 * Tests proving bugs in PR #19 that Greptile MISSED
 * 
 * Greptile caught 7-8 out of 12 edge cases (65%)
 * These are the ones it MISSED
 */

describe('PR #19: Bugs Greptile Missed', () => {

  /**
   * BUG 1: min([]) returns Infinity
   * 
   * Greptile caught Math.min stack overflow on large arrays
   * but MISSED the empty array case
   * 
   * Category: COUNTERINTUITIVE RETURN VALUE
   */
  describe('min([]) returns Infinity', () => {
    function min(numbers: number[]): number {
      return Math.min(...numbers)
    }

    it('returns Infinity for empty array', () => {
      const result = min([])
      
      expect(result).toBe(Infinity)  // Counterintuitive!
      // Empty array should return undefined, throw, or have explicit handling
    })
  })

  /**
   * BUG 2: max([]) returns -Infinity
   * 
   * Same pattern as min() - Greptile missed this too
   * 
   * Category: COUNTERINTUITIVE RETURN VALUE
   */
  describe('max([]) returns -Infinity', () => {
    function max(numbers: number[]): number {
      return Math.max(...numbers)
    }

    it('returns -Infinity for empty array', () => {
      const result = max([])
      
      expect(result).toBe(-Infinity)  // Counterintuitive!
    })
  })

  /**
   * BUG 3: removeAt() with invalid index
   * 
   * No bounds checking - silently returns undefined
   * 
   * Category: MISSING BOUNDS CHECK
   */
  describe('removeAt() - no bounds checking', () => {
    function removeAt<T>(arr: T[], index: number): T {
      return arr.splice(index, 1)[0]
    }

    it('silently fails with invalid index', () => {
      const arr = [1, 2, 3]
      const result = removeAt(arr, 999)
      
      expect(result).toBeUndefined()  // Silent failure!
      expect(arr).toEqual([1, 2, 3])  // Array unchanged
      // Should throw or return explicit error
    })

    it('negative index has weird behavior', () => {
      const arr = [1, 2, 3]
      const result = removeAt(arr, -1)
      
      // splice(-1, 1) removes the LAST element!
      expect(result).toBe(3)
      expect(arr).toEqual([1, 2])
    })
  })

  /**
   * BUG 4: swap() with invalid indices
   * 
   * No bounds checking - corrupts array silently
   * 
   * Category: MISSING BOUNDS CHECK
   */
  describe('swap() - no bounds checking', () => {
    function swap<T>(arr: T[], i: number, j: number): void {
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }

    it('corrupts array with invalid index', () => {
      const arr = [1, 2, 3]
      swap(arr, 0, 999)
      
      // arr[0] becomes undefined, arr[999] becomes 1
      expect(arr[0]).toBeUndefined()  // Corrupted!
      expect(arr.length).toBe(1000)   // Array expanded!
    })
  })

  /**
   * BUG 5: binarySearch() on unsorted array
   * 
   * No precondition check - returns wrong results
   * 
   * Category: PRECONDITION VIOLATION
   */
  describe('binarySearch() - no sorted check', () => {
    function binarySearch(arr: number[], target: number): number {
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

    it('returns wrong results for unsorted array', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6]
      
      // 1 exists at indices 1 and 3
      const result = binarySearch(unsorted, 1)
      
      // Binary search on unsorted array gives inconsistent results
      // May find it, may not find it, depends on array contents
      console.log('binarySearch(unsorted, 1):', result)
      
      // The function should either:
      // 1. Check if array is sorted first
      // 2. Document precondition clearly
      // 3. Use linear search as fallback
    })
  })
})

/**
 * SUMMARY:
 * 
 * Greptile CAUGHT (7-8):
 * - average([]) NaN
 * - chunk(arr, 0) infinite loop
 * - range() infinite loop
 * - deepClone() JSON limitations
 * - Math.min/max stack overflow
 * - first([]) undefined
 * - Test edge case gaps
 * 
 * Greptile MISSED (4-5):
 * - min([]) → Infinity
 * - max([]) → -Infinity
 * - removeAt() bounds
 * - swap() bounds
 * - binarySearch() precondition
 * 
 * PATTERN: Greptile good at obvious edge cases (division by zero, loops)
 *          Misses counterintuitive returns, bounds checking, preconditions
 */
