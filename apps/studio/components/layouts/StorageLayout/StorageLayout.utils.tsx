import type { ProductMenuGroupItem } from 'components/ui/ProductMenu/ProductMenu.types'
import { Archive } from 'lucide-react'

export const generateStoragePageItemsMenu = (
  ref: string,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
  }
): ProductMenuGroupItem[] => {
  return [
    {
      name: 'Buckets',
      key: 'buckets',
      url: `/project/${ref}/storage/buckets`,
      hasChild: true,
      childId: 'bucketId',
      childIcon: (
        <Archive size={12} strokeWidth={1.5} className={'text-foreground w-full h-full'} />
      ),
    },
    {
      name: 'Image transformations',
      key: 'image-transformations',
      url: `/project/${ref}/storage/image-transformations`,
    },
    {
      name: 'Uploads',
      key: 'uploads',
      url: `/project/${ref}/storage/uploads`,
    },
    {
      name: 'S3',
      key: 's3',
      url: `/project/${ref}/storage/s3`,
    },
  ]
}
