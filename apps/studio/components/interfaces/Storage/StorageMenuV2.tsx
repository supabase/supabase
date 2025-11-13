import Link from 'next/link'

import { IS_PLATFORM, useParams } from 'common'
import {
  useIsAnalyticsBucketsEnabled,
  useIsVectorBucketsEnabled,
} from 'data/config/project-storage-config-query'
import { Badge, Menu } from 'ui'
import { BUCKET_TYPES } from './Storage.constants'
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

          {Object.entries(BUCKET_TYPES)
            .filter(([_, config]) => IS_PLATFORM || (!IS_PLATFORM && !config.platformOnly))
            .map(([type, config]) => {
              const isSelected = page === type
              const isAlphaEnabled =
                (type === 'analytics' && isAnalyticsBucketsEnabled) ||
                (type === 'vectors' && isVectorBucketsEnabled)

              return (
                <Link key={type} href={`/project/${ref}/storage/${type}`}>
                  <Menu.Item rounded active={isSelected}>
                    <div className="flex items-center justify-between">
                      <p className="truncate">{config.displayName}</p>
                      {isAlphaEnabled && (
                        <Badge variant="default" size="small">
                          New
                        </Badge>
                      )}
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
