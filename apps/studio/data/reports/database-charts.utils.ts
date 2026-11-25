import type { Datum } from '@/components/ui/Charts/Charts.types'

const SWAP_BYTES = 1024 ** 3

export function getMemoryCommitmentRanges(
  data: Datum[],
  lowerFraction: number,
  upperFraction?: number
): ([number, number] | null)[] {
  const maxCommitted = data.reduce((maximum, point) => {
    const committed = point.ram_commit_used
    return typeof committed === 'number' && Number.isFinite(committed)
      ? Math.max(maximum, committed)
      : maximum
  }, 0)

  return data.map((point) => {
    const commitLimit = point.ram_commit_limit
    if (
      typeof commitLimit !== 'number' ||
      !Number.isFinite(commitLimit) ||
      commitLimit <= SWAP_BYTES
    ) {
      return null
    }

    const physicalMemory = (commitLimit - SWAP_BYTES) * 2
    const lower = SWAP_BYTES + physicalMemory * lowerFraction
    const upper =
      upperFraction === undefined
        ? Math.max(SWAP_BYTES + physicalMemory, maxCommitted)
        : SWAP_BYTES + physicalMemory * upperFraction

    return [lower, upper]
  })
}
