import Link from 'next/link'

import { IS_PLATFORM, useParams } from 'common'
import { Menu } from 'ui'
import { BUCKET_TYPES, BUCKET_TYPE_KEYS } from './Storage.constants'
import { useStorageV2Page } from './Storage.utils'

export const StorageMenuV2 = () => {
  const { ref } = useParams()
  const page = useStorageV2Page()

  return (
    <Menu type="pills" className="my-6 flex flex-grow flex-col">
      <div className="space-y-6">
        <div className="mx-3">
          <Menu.Group title={<span className="uppercase font-mono">Manage</span>} />

          {BUCKET_TYPE_KEYS.map((bucketTypeKey) => {
            const isSelected = page === bucketTypeKey
            const config = BUCKET_TYPES[bucketTypeKey]

            return (
              <Link key={bucketTypeKey} href={`/project/${ref}/storage/${bucketTypeKey}`}>
                <Menu.Item rounded active={isSelected}>
                  <p className="truncate">{config.displayName}</p>
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
