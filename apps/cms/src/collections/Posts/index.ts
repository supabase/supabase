import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { Quote } from '../../blocks/Quote/config'
import { YouTube } from '../../blocks/YouTube/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '@/fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) => {
        const baseUrl = process.env.BLOG_APP_URL || 'http://localhost:3000'
        // Always use the preview route for live preview to ensure draft mode is enabled
        return `${baseUrl}/api/preview?slug=${data?.slug}&secret=${process.env.PREVIEW_SECRET || 'preview-secret'}`
      },
      breakpoints: [
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1920,
          height: 1080,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
      ],
    },
    preview: (data) => {
      const baseUrl = process.env.BLOG_APP_URL || 'http://localhost:3000'
      // Always use the preview route to ensure draft mode is enabled
      return `${baseUrl}/api/preview?slug=${data?.slug}&secret=${process.env.PREVIEW_SECRET || 'preview-secret'}`
    },
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    // {
    //   name: 'slug',
    //   type: 'text',
    //   required: true,
    //   unique: true,
    //   admin: {
    //     position: 'sidebar',
    //   },
    //   validate: (value: string | string[] | null | undefined) => {
    //     const regex = /^[a-z][a-z0-9-]{2,49}$/
    //     if (!regex.test(value as string)) {
    //       return 'Slug must start with a letter, contain only lowercase letters, numbers, and hyphens, and be between 3-50 characters'
    //     }
    //     return true
    //   },
    // },
    ...slugField(),
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock, Quote, YouTube] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'thumb',
              type: 'upload',
              relationTo: 'media',
              required: false,
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: false,
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
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
            {
              name: 'date',
              type: 'date',
              admin: {
                position: 'sidebar',
              },
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
              name: 'description',
              type: 'textarea',
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
            // {
            //   name: 'relatedPosts',
            //   type: 'relationship',
            //   admin: {
            //     position: 'sidebar',
            //   },
            //   filterOptions: ({ id }) => {
            //     return {
            //       id: {
            //         not_in: [id],
            //       },
            //     }
            //   },
            //   hasMany: true,
            //   relationTo: 'posts',
            // },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 200, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

export default Posts
