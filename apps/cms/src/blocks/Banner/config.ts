import type { Block } from 'payload'

export const Banner: Block = {
  slug: 'banner',
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Success', value: 'success' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'text',
      admin: {
        components: {
          Field: '@/fields/MarkdownEditor/Component#MarkdownEditor',
        },
      },
      label: false,
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
}
