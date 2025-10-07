import { useState } from 'react'
import Link from 'next/link'
import { Edit, Shield } from 'lucide-react'

import { useParams } from 'common'

import { EditBucketModal } from 'components/interfaces/Storage/EditBucketModal'
import type { Bucket } from 'data/storage/buckets-query'
import { useStoragePolicyCounts } from 'hooks/storage/useStoragePolicyCounts'
import { Button, Badge } from 'ui'
import { ChevronRight } from 'lucide-react'

interface BucketHeaderProps {
  bucket: Bucket
}

export const BucketHeader = ({ bucket }: BucketHeaderProps) => {
  const { ref } = useParams()
  const [showEditModal, setShowEditModal] = useState(false)

  const { getPolicyCount } = useStoragePolicyCounts([bucket])
  const policyCount = getPolicyCount(bucket.name)

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
        <div className="flex items-center gap-2">
          <Button
            asChild
            type="default"
            icon={<Shield size={14} />}
            iconRight={
              policyCount > 0 ? (
                <span className="w-4 h-4 bg-surface-200 text-foreground-light text-xs rounded-full flex items-center justify-center font-medium">
                  {policyCount}
                </span>
              ) : undefined
            }
          >
            <Link href={`/project/${ref}/storage/files/policies`}>Policies</Link>
          </Button>
          <Button type="default" icon={<Edit size={14} />} onClick={() => setShowEditModal(true)}>
            Edit bucket
          </Button>
        </div>
      </div>

      <EditBucketModal
        visible={showEditModal}
        bucket={bucket}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}
