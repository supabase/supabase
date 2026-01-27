import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

import { isAnyone } from '../../access/isAnyone.ts'
import { isAuthenticated } from '../../access/isAuthenticated.ts'
import { Banner } from '../../blocks/Banner/config.ts'
import { Code } from '../../blocks/Code/config.ts'
import { MediaBlock } from '../../blocks/MediaBlock/config.ts'
import { Quote } from '../../blocks/Quote/config.ts'
import { YouTube } from '../../blocks/YouTube/config.ts'
import { slugField } from '../../fields/slug/index.ts'
import { WWW_SITE_ORIGIN } from '../../utilities/constants.ts'
import { populateAuthors } from './hooks/populateAuthors.ts'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost.ts'

const launchweekOptions = [
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: 'x', value: 'x' },
  { label: 'ga', value: 'ga' },
  { label: '12', value: '12' },
  { label: '13', value: '13' },
  { label: '14', value: '14' },
  { label: '15', value: '15' },
]

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt', 'publishedAt'],
    preview: (data) => {
      const baseUrl = WWW_SITE_ORIGIN || 'http://localhost:3000'
      // Always use the preview route to ensure draft mode is enabled
      return `${baseUrl}/api-v2/cms/preview?slug=${data?.slug}&secret=${process.env.PREVIEW_SECRET || 'secret'}`
    },
  },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: isAnyone,
    update: isAuthenticated,
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
      index: true,
    },
    ...slugField(),
    {
      name: 'description',
      type: 'textarea',
      label: 'Description / subtitle',
      admin: {
        description: 'Appears as subheading in the blog post preview.',
      },
    },
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
              admin: {
                description: 'Will show up as the blog post cover. Required.',
              },
            },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'authors',
              hasMany: true,
              admin: {
                description: 'Authors must be one or more. Required.',
              },
            },
            {
              name: 'categories',
              type: 'relationship',
              hasMany: true,
              relationTo: 'categories',
              admin: {
                description: 'Select only one category. Required.',
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
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              admin: {
                description: 'Tags can be one or more. Optional.',
              },
            },
            {
              name: 'toc_depth',
              type: 'number',
              defaultValue: 3,
              admin: {
                hidden: true,
              },
            },
            {
              name: 'launchweek',
              type: 'select',
              options: launchweekOptions,
              admin: {
                description:
                  'Select a launch week to show launch week summary at the bottom of the blog post. Optional.',
              },
            },
          ],
          label: 'Metadata',
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
              overrides: {
                admin: {
                  description: 'Defaults to the title of the post, if not set.',
                },
              },
            }),
            MetaImageField({
              relationTo: 'media',
              overrides: {
                admin: {
                  description: 'Defaults to the "thumb" image, if not set.',
                },
              },
            }),

            MetaDescriptionField({
              overrides: {
                admin: {
                  description: 'Defaults to the description of the post, if not set.',
                },
              },
            }),
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
    /**
     * "publishedAt" is only internal to cms to determine if the blog post is published or not, but it's not used for sorting blog posts in www
     * */
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            /**
             * Set the "date" field to the current date if user doesn't set it
             */
            if (!siblingData.date) {
              siblingData.date = new Date()
            }
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    /**
     * "date" is used to determine the chronological order of the blog post in www
     */
    {
      name: 'date',
      type: 'date',
      label: 'Blog Post Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'This date will determine the chronological order of the blog post. Required.',
        position: 'sidebar',
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
      // NOTE: disabled autosave as it might overload connections if many users are editing at the same time
      // autosave: {
      //   interval: 200,
      // },
      // TODO: enable schedulePublish to work with cron job
      // schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

export default Posts
