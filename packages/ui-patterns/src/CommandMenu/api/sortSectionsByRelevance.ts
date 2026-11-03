import { commandScore } from './commandScore'

type SectionMeta = { relevanceGroup?: string; priority?: number }

/**
 * cmdk is meant to reorder groups by their best matching item while searching,
 * but its lookup of the group element fails, so groups stay in registration
 * order. Do it here instead. The sort is stable, so sections with equal scores
 * keep their registered (priority) order.
 *
 * Sections that share a `meta.relevanceGroup` are ranked together: the group
 * takes the position of its best-scoring section and stays contiguous, with
 * its sections ordered by `meta.priority` (then registered order). Use this
 * for sections that read as one unit, like tables and their policies, so
 * relevance doesn't reshuffle them relative to each other.
 */
export function sortSectionsByRelevance<
  T extends { commands: readonly { name: string; value?: string }[]; meta?: SectionMeta },
>(sections: readonly T[], query: string): readonly T[] {
  const search = query.trim()
  if (!search) return sections

  const bestScore = (section: T) =>
    section.commands.reduce(
      (best, command) =>
        Math.max(best, commandScore((command.value ?? command.name).trim(), search)),
      0
    )

  const entries = sections.map((section, index) => ({
    section,
    index,
    group: section.meta?.relevanceGroup,
    priority: section.meta?.priority ?? Infinity,
    score: bestScore(section),
  }))

  // A group ranks by its best section's score and sits where its first section was registered
  const groups = new Map<string, { score: number; index: number }>()
  for (const { group, score, index } of entries) {
    if (group === undefined) continue
    const current = groups.get(group)
    groups.set(group, {
      score: Math.max(current?.score ?? 0, score),
      index: Math.min(current?.index ?? index, index),
    })
  }

  const rank = (entry: (typeof entries)[number]) =>
    (entry.group !== undefined ? groups.get(entry.group) : undefined) ?? entry

  return entries
    .sort((a, b) => {
      const [rankA, rankB] = [rank(a), rank(b)]
      if (rankA.score !== rankB.score) return rankB.score - rankA.score
      if (rankA.index !== rankB.index) return rankA.index - rankB.index
      return a.priority - b.priority || a.index - b.index
    })
    .map(({ section }) => section)
}
