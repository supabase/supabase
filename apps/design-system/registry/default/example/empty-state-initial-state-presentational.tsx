import { BucketAdd } from 'icons'
import { Plus } from 'lucide-react'
import { Button } from 'ui'

export default function EmptyStateInitialStatePresentational() {
  return (
    <aside className="border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-4 items-center text-center gap-1 text-balance">
      <div className="flex flex-col gap-3 items-center text-center">
        <BucketAdd size={24} strokeWidth={1.5} className="text-foreground-muted" />
        <div className="flex flex-col gap-1">
          <h3>Create a vector bucket</h3>
          <p className="text-foreground-light text-sm">
            Store, index, and query your vector embeddings at scale.
          </p>
        </div>
      </div>
      <Button size="tiny" type="primary" className="w-fit" icon={<Plus size={14} />}>
        Create bucket
      </Button>
    </aside>
  )
}
