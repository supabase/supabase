// After profile creation returns a 409, the profile is refetched once straight away and then once
// more after each of these delays, to ride out a read replica that hasn't caught up yet.
export const CONFLICT_REFETCH_DELAYS_MS = [500, 1000, 2000]
