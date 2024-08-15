import type { ICommandSection } from 'ui-patterns/CommandMenu/internal/CommandSection'

const DEFAULT_PRIORITY = 10

/**
 * Order sections in the command menu by a numbered priority. The lower the
 * number, the higher the priority.
 *
 * Specify the priority when creating or updating the section by passing the
 * option `{ sectionMeta: { priority: number } }`.
 *
 * The priority rankings are roughly as follows:
 * 1. Super important, stick to top. Reserved for special cases.
 * 2. We want to highlight this and encourage people to use it.
 * 3. Easy access for most important features/commands.
 */
export function orderCommandSectionsByPriority(sections: Array<ICommandSection>) {
  return sections
    .slice()
    .sort((a, b) => (a.meta?.priority ?? DEFAULT_PRIORITY) - (b.meta?.priority ?? DEFAULT_PRIORITY))
}
