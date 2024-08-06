import type { ICommandSection } from 'ui-patterns/CommandMenu/internal/CommandSection'

const DEFAULT_PRIORITY = 10

export function orderCommandSectionsByPriority(sections: Array<ICommandSection>) {
  return sections
    .slice()
    .sort((a, b) => (a.meta?.priority ?? DEFAULT_PRIORITY) - (b.meta?.priority ?? DEFAULT_PRIORITY))
}
