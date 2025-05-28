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
// import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidateEvent } from './hooks/revalidateEvent'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from '@/fields/slug'
import { timezoneOptions } from '../../config/timezones'

const eventTypeOptions = [
  { label: 'Conference', value: 'conference' },
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Launch Week', value: 'launch-week' },
  { label: 'Meetup', value: 'meetup' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Other', value: 'other' },
]

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: (data) => {
      const baseUrl = process.env.BLOG_APP_URL || 'http://localhost:3000'
      const isDraft = data?._status === 'draft'
      return `${baseUrl}/events/${data?.slug}${isDraft ? '?preview=true' : ''}`
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
    ...slugField(),
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
          label: 'Meta',
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
              name: 'type',
              type: 'select',
              hasMany: true,
              options: eventTypeOptions,
              admin: {
                description: 'Event type',
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
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'duration',
              type: 'text',
            },
            {
              name: 'timezone',
              type: 'select',
              options: timezoneOptions,
            },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'authors',
              hasMany: true,
            },
            {
              name: 'onDemand',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Events that are on-demand following a registration process',
              },
            },
            {
              name: 'disable_page_build',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'When true, we don\'t build the page and link directly to an external event page (requires Link to be set)',
              },
            },
            {
              name: 'link',
              type: 'group',
              admin: {
                description: 'Used on event previews to link to a custom event page',
                position: 'sidebar',
              },
              fields: [
                {
                  name: 'href',
                  type: 'text',
                  required: false,
                },
                {
                  name: 'target',
                  type: 'select',
                  options: [
                    { label: 'Same window', value: '_self' },
                    { label: 'New window', value: '_blank' },
                  ],
                  defaultValue: '_blank',
                },
                {
                  name: 'label',
                  type: 'text',
                },
              ],
            },
            {
              name: 'main_cta',
              type: 'group',
              admin: {
                description: 'Main CTA button on the event page',
              },
              fields: [
                {
                  name: 'href',
                  type: 'text',
                  required: false,
                },
                {
                  name: 'target',
                  type: 'select',
                  options: [
                    { label: 'Same window', value: '_self' },
                    { label: 'New window', value: '_blank' },
                  ],
                  defaultValue: '_blank',
                },
                {
                  name: 'label',
                  type: 'text',
                },
                {
                  name: 'disabled_label',
                  type: 'text',
                },
              ],
            },
          ],
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
    afterChange: [revalidateEvent],
    // afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

export default Events
