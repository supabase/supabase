import { Plus } from 'lucide-react'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

export default function EmptyStatePresentationalIcon() {
  return (
    <EmptyStatePresentational
      title="Create an auth hook"
      description="Use Postgres functions or HTTP endpoints to customize your authentication flow."
    >
      <Button size="tiny" variant="primary" icon={<Plus size={14} />}>
        Add hook
      </Button>
    </EmptyStatePresentational>
  )
}
