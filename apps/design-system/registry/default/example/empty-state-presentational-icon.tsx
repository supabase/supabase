import { BucketPlus } from 'icons'
import { Plus } from 'lucide-react'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'

export default function EmptyStatePresentationalIcon() {
  return (
    <EmptyStatePresentational
      icon={BucketPlus}
      title="Create a vector bucket"
      description="Store, index, and query your vector embeddings at scale."
    >
      <Button size="tiny" type="primary" icon={<Plus size={14} />}>
        Create bucket
      </Button>
    </EmptyStatePresentational>
  )
}
