import type { ProductMenuGroupItem } from 'components/ui/ProductMenu/ProductMenu.types'
import { Archive } from 'lucide-react'

export const generateFunctionsPageItemsMenu = (
  ref: string,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
  }
): ProductMenuGroupItem[] => {
  return [
    {
      name: 'Functions',
      key: 'functions',
      url: `/project/${ref}/functions`,
      hasChild: true,
      childId: 'functionSlug',
      childIcon: (
        <Archive size={12} strokeWidth={1.5} className={'text-foreground w-full h-full'} />
      ),
      childItems: [
        {
          name: 'Overview',
          key: 'functions',
          url: `/project/${ref}/functions`,
        },
        {
          name: 'Functions',
          key: 'functions',
          url: `/project/${ref}/functions`,
        },
      ],
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
