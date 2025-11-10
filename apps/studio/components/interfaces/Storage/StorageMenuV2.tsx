import Link from 'next/link'

import { IS_PLATFORM, useParams } from 'common'
import {
  useIsAnalyticsBucketsEnabled,
  useIsVectorBucketsEnabled,
} from 'data/config/project-storage-config-query'
import { Badge, Menu } from 'ui'
import { BUCKET_TYPES, BUCKET_TYPE_KEYS } from './Storage.constants'
import { useStorageV2Page } from './Storage.utils'

export const StorageMenuV2 = () => {
  const { ref } = useParams()
  const page = useStorageV2Page()

  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef: ref })

  return (
    <Menu type="pills" className="my-6 flex flex-grow flex-col">
      <div className="space-y-6">
        <div className="mx-3">
          <Menu.Group title={<span className="uppercase font-mono">Manage</span>} />

          {BUCKET_TYPE_KEYS.map((bucketTypeKey) => {
            const isSelected = page === bucketTypeKey
            const config = BUCKET_TYPES[bucketTypeKey]
            const isAlphaEnabled =
              (bucketTypeKey === 'analytics' && isAnalyticsBucketsEnabled) ||
              (bucketTypeKey === 'vectors' && isVectorBucketsEnabled)

            return (
              <Link key={bucketTypeKey} href={`/project/${ref}/storage/${bucketTypeKey}`}>
                <Menu.Item rounded active={isSelected}>
                  <div className="flex items-center justify-between">
                    <p className="truncate">{config.displayName}</p>
                    {isAlphaEnabled && <Badge variant="warning">ALPHA</Badge>}
                  </div>
                </Menu.Item>
              </Link>
            )
          })}
        </div>

        {IS_PLATFORM && (
          <>
            <div className="h-px w-full bg-border" />
            <div className="mx-3">
              <Menu.Group title={<span className="uppercase font-mono">Configuration</span>} />

              <Link href={`/project/${ref}/storage/s3`}>
                <Menu.Item rounded active={page === 's3'}>
                  <p className="truncate">S3</p>
                </Menu.Item>
              </Link>
            </div>
          </>
        )}
      </div>
    </Menu>
  )
}
