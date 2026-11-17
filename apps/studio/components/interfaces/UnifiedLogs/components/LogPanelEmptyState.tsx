import type { LucideIcon } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

/** Centers a log panel tab's empty state, so every tab shows it the same way */
export function LogPanelEmptyState({
  icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <EmptyStatePresentational
        icon={icon}
        title={title}
        description={description}
        className="border-0 bg-transparent px-2 py-6"
      />
    </div>
  )
}
