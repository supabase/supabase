import { useParams } from 'common'
import Link from 'next/link'
import { Menu } from 'ui'
import { BUCKET_TYPES, BUCKET_TYPE_KEYS, DEFAULT_BUCKET_TYPE } from './Storage.constants'

export const StorageMenuV2 = () => {
  const { ref, bucketType } = useParams()
  const selectedBucketType = bucketType || DEFAULT_BUCKET_TYPE

  return (
    <Menu type="pills" className="mt-6 flex flex-grow flex-col">
      <div className="mx-3">
        <Menu.Group title={<span className="uppercase font-mono">Bucket Types</span>} />

        {BUCKET_TYPE_KEYS.map((bucketTypeKey) => {
          const isSelected = selectedBucketType === bucketTypeKey
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
    </Menu>
  )
}
