import { CollectionConfig } from 'payload'

const BlogPost: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'Title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
      validate: (value: string | string[] | null | undefined) => {
        const regex = /^[a-z][a-z0-9-]{2,49}$/
        if (!regex.test(value as string)) {
          return 'Slug must start with a letter, contain only lowercase letters, numbers, and hyphens, and be between 3-50 characters'
        }
        return true
      },
    },
    {
      name: 'thumb',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'toc_depth',
      type: 'number',
      defaultValue: 2,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'launchweek',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
  // hooks: {
  //   beforeValidate: [generateReadingTime],
  // },
}

export default BlogPost
