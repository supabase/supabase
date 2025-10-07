import { Edit } from 'lucide-react'
import { useState } from 'react'

import { EditBucketModal } from 'components/interfaces/Storage/EditBucketModal'
import type { Bucket } from 'data/storage/buckets-query'
import { Button, Badge } from 'ui'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface BucketHeaderProps {
  bucket: Bucket
}

export const BucketHeader = ({ bucket }: BucketHeaderProps) => {
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-sm text-foreground-lighter">Files</p>
            <ChevronRight size={12} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl text-foreground">{bucket.name}</h1>
            {bucket.public && <Badge variant="warning">Public</Badge>}
          </div>
        </div>

        <Button type="default" icon={<Edit size={14} />} onClick={() => setShowEditModal(true)}>
          Edit bucket
        </Button>
      </div>

      <EditBucketModal
        visible={showEditModal}
        bucket={bucket}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}
