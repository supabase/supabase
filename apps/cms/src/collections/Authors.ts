import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'position', 'author_id'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
      label: 'Author Name',
      index: true,
    },
    {
      name: 'author_id',
      type: 'text',
      required: true,
      unique: true,
      label: 'Author ID',
      admin: {
        description: 'Unique identifier for the author',
      },
    },
    {
      name: 'username',
      type: 'text',
      label: 'Username',
      admin: {
        description: 'GitHub/social username',
      },
    },
    {
      name: 'position',
      type: 'text',
      label: 'Position',
    },
    {
      name: 'company',
      type: 'text',
      label: 'Company',
      admin: {
        description: 'Company name (for external/guest authors)',
      },
    },
    {
      name: 'author_url',
      type: 'text',
      label: 'Profile URL',
      admin: {
        description: 'Link to GitHub, Twitter, LinkedIn, etc.',
      },
    },
    {
      name: 'author_image_url',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Profile Image',
    },
  ],
  timestamps: true,
}

export default Authors
