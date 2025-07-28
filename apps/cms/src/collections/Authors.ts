import { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'author',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
    },
    {
      name: 'author_id',
      type: 'text',
    },
    {
      name: 'position',
      type: 'text',
    },
    {
      name: 'author_url',
      type: 'text',
    },
    {
      name: 'author_image_url',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'username',
      type: 'text',
    },
  ],
  timestamps: true,
}

export default Authors
