import { commandScore } from './commandScore'

/**
 * cmdk is meant to reorder groups by their best matching item while searching,
 * but its lookup of the group element fails, so groups stay in registration
 * order. Do it here instead. The sort is stable, so sections with equal scores
 * keep their registered (priority) order.
 */
export function sortSectionsByRelevance<
  T extends { commands: readonly { name: string; value?: string }[] },
>(sections: readonly T[], query: string): readonly T[] {
  const search = query.trim()
  if (!search) return sections

  const bestScore = (section: T) =>
    section.commands.reduce(
      (best, command) =>
        Math.max(best, commandScore((command.value ?? command.name).trim(), search)),
      0
    )

  return sections
    .map((section) => ({ section, score: bestScore(section) }))
    .sort((a, b) => b.score - a.score)
    .map(({ section }) => section)
}
