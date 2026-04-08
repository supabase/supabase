// Number of pages to process in each batch for ctid-based deletion
// Based on default Postgres shared buffer size of 128 MB, which fits ~16k pages
export const CTID_BATCH_PAGE_SIZE = 5_000

/**
 * Validates that a value is a finite non-negative integer.
 */
export function validatePageNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative integer, got: ${value}`)
  }
}
