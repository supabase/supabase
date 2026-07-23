import { Table2 } from 'lucide-react'

export const UserActivityTablePlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-2 rounded-md border border-dashed border-default py-16 text-center">
      <Table2 size={20} strokeWidth={1.5} className="text-foreground-lighter" />
      <p className="text-sm text-foreground">Table view coming soon</p>
      <p className="text-sm text-foreground-light">
        Switch to the timeline to explore this user's activity.
      </p>
    </div>
  )
}
