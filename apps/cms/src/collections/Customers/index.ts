import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { isAnyone } from '../../access/isAnyone.ts'
import { isAuthenticated } from '../../access/isAuthenticated.ts'

import { Banner } from '../../blocks/Banner/config.ts'
import { Code } from '../../blocks/Code/config.ts'
import { MediaBlock } from '../../blocks/MediaBlock/config.ts'
import { Quote } from '../../blocks/Quote/config.ts'
import { YouTube } from '../../blocks/YouTube/config.ts'
import { revalidateDelete, revalidateCustomer } from './hooks/revalidateCustomer.ts'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '../../fields/slug/index.ts'
import { WWW_SITE_ORIGIN } from '../../utilities/constants.ts'

const industryOptions = [
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Fintech', value: 'fintech' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Education', value: 'education' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Media', value: 'media' },
  { label: 'Real Estate', value: 'real-estate' },
  { label: 'SaaS', value: 'saas' },
  { label: 'Social', value: 'social' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'AI', value: 'ai' },
  { label: 'Developer Tools', value: 'developer-tools' },
]

const companySizeOptions = [
  { label: 'Startup', value: 'startup' },
  { label: 'Enterprise', value: 'enterprise' },
  { label: 'Independent Developer', value: 'indie_dev' },
]

const regionOptions = [
  { label: 'Asia', value: 'Asia' },
  { label: 'Europe', value: 'Europe' },
  { label: 'North America', value: 'North America' },
  { label: 'South America', value: 'South America' },
  { label: 'Africa', value: 'Africa' },
  { label: 'Oceania', value: 'Oceania' },
]

const supabaseProductOptions = [
  { label: 'Database', value: 'database' },
  { label: 'Auth', value: 'auth' },
  { label: 'Storage', value: 'storage' },
  { label: 'Realtime', value: 'realtime' },
  { label: 'Functions', value: 'functions' },
  { label: 'Vector', value: 'vector' },
]

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    preview: (data) => {
      const baseUrl = WWW_SITE_ORIGIN || 'http://localhost:3000'
      const isDraft = data?._status === 'draft'
      return `${baseUrl}/customers/${data?.slug}${isDraft ? '?preview=true' : ''}`
    },
  },
  access: {
    // create: isAuthenticated,
    // delete: isAuthenticated,
    // read: isAnyone,
    // update: isAuthenticated,
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  defaultPopulate: {
    name: true,
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    ...slugField('name'),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
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
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'about',
              type: 'textarea',
              admin: {
                description: 'Short description about the company',
              },
            },
            {
              name: 'company_url',
              type: 'text',
              admin: {
                description: 'URL of the company website',
              },
            },
            {
              name: 'stats',
              type: 'array',
              admin: {
                description: 'Key statistics or metrics to highlight',
              },
              fields: [
                {
                  name: 'stat',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'misc',
              type: 'array',
              admin: {
                description: 'Miscellaneous information (e.g., Founded, Location)',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'industry',
              type: 'select',
              hasMany: true,
              options: industryOptions,
              admin: {
                description: 'Industry categories',
              },
            },
            {
              name: 'company_size',
              type: 'select',
              options: companySizeOptions,
              admin: {
                description: 'Size of the company',
              },
            },
            {
              name: 'region',
              type: 'select',
              options: regionOptions,
              admin: {
                description: 'Geographic region',
              },
            },
            {
              name: 'supabase_products',
              type: 'select',
              hasMany: true,
              options: supabaseProductOptions,
              admin: {
                description: 'Supabase products being used',
              },
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.name',
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
              titlePath: 'meta.name',
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
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'logo_inverse',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'Light mode logo',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [revalidateCustomer],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      // autosave: {
      //   interval: 100,
      // },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

export default Customers
