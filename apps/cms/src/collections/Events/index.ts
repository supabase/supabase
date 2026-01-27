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
import { timezoneOptions } from '../../utilities/timezones.ts'
import { revalidateDelete, revalidateEvent } from './hooks/revalidateEvent.ts'

const eventTypeOptions = [
  { label: 'Conference', value: 'conference' },
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Launch Week', value: 'launch-week' },
  { label: 'Meetup', value: 'meetup' },
  { label: 'Office Hours', value: 'office-hours' },
  { label: 'Talk', value: 'talk' },
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
      const baseUrl = WWW_SITE_ORIGIN || 'http://localhost:3000'
      // Always use the preview route to ensure draft mode is enabled
      return `${baseUrl}/api-v2/cms/preview?slug=${data?.slug}&path=events&secret=${process.env.PREVIEW_SECRET || 'secret'}`
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
      name: 'subtitle',
      type: 'text',
      admin: {
        description: 'Used in the event page as subtitle.',
      },
    },
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
              required: false,
            },
          ],
        },
        {
          label: 'Metadata',
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
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              name: 'timezone',
              type: 'select',
              options: timezoneOptions,
            },
            {
              name: 'showEndDate',
              type: 'checkbox',
              defaultValue: false,
              admin: {},
            },
            {
              name: 'endDate',
              type: 'date',
              admin: {
                description:
                  'If "showEndDate" is true, this will define when the event terminates.',
                condition: (data) => {
                  return data.showEndDate
                },
              },
            },
            {
              name: 'duration',
              type: 'text',
              admin: {
                description:
                  'Text string to display on the event page to indicate the duration of the event. (e.g. "45 mins", "2 days")',
              },
            },
            {
              name: 'onDemand',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Events that are will remain available on the events page after the event has ended.',
              },
            },
            {
              name: 'disablePageBuild',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'When true, the event page will not be built. It will link directly to an external event page (requires Link to be set)',
              },
            },
            {
              name: 'link',
              type: 'group',
              admin: {
                description:
                  'Used on event previews to link to a custom page if "disablePageBuild" is true.',
                condition: (data) => {
                  return data.disablePageBuild
                },
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
              ],
            },
            {
              name: 'mainCta',
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
                  name: 'disabled',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'disabled_label',
                  type: 'text',
                  admin: {
                    description: 'Text for the main CTA button if "mainCta.disabled" is true.',
                    condition: (data) => data.mainCta.disabled,
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Participants',
          fields: [
            {
              name: 'company',
              type: 'group',
              fields: [
                {
                  name: 'showCompany',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description:
                      'If an external company is collaborating with the event, this will display their logo on the event page.',
                  },
                },
                {
                  name: 'name',
                  type: 'text',
                  required: false,
                  admin: {
                    condition: (data) => data.company.showCompany,
                  },
                },
                {
                  name: 'websiteUrl',
                  type: 'text',
                  admin: {
                    condition: (data) => data.company.showCompany,
                  },
                },
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  required: false,
                  admin: {
                    condition: (data) => data.company.showCompany,
                  },
                },
                {
                  name: 'logo_light',
                  type: 'upload',
                  relationTo: 'media',
                  required: false,
                  admin: {
                    description: 'Light mode logo',
                    condition: (data) => data.company.showCompany,
                  },
                },
              ],
            },
            {
              name: 'participants',
              type: 'group',
              fields: [
                {
                  name: 'showParticipants',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description:
                      'Could be speakers, authors, guests, etc. It would source from Authors collections.',
                  },
                },
                {
                  name: 'participants',
                  type: 'relationship',
                  relationTo: 'authors',
                  hasMany: true,
                  admin: {
                    condition: (data) => data.participants.showParticipants,
                  },
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
      // autosave: {
      //   interval: 100,
      // },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

export default Events
