import Link from 'next/link'
import { useParams } from 'common'
import { Menu } from 'ui'

const StorageMenuV2 = () => {
  const { ref, bucketType } = useParams()
  const bucketTypes = ['Media', 'Analytics', 'Vectors']
  const selectedBucketType = bucketType || 'Media' // Default to Media

  return (
    <Menu type="pills" className="mt-6 flex flex-grow flex-col">
      <div className="mx-3">
        <Menu.Group title={<span className="uppercase font-mono">Bucket Types</span>} />

        {bucketTypes.map((bucketType, idx: number) => {
          const isSelected = selectedBucketType === bucketType
          return (
            <Link
              key={`${idx}_${bucketType}`}
              href={`/project/${ref}/storage/${bucketType.toLowerCase()}`}
            >
              <Menu.Item rounded active={isSelected}>
                <p className="truncate">{bucketType}</p>
              </Menu.Item>
            </Link>
          )
        })}
      </div>
    </Menu>
  )
}

export default StorageMenuV2
