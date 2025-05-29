import type { Block } from 'payload'

export const Quote: Block = {
  slug: 'quote',
  fields: [
    {
      name: 'img',
      type: 'upload',
      relationTo: 'media',
      label: 'Avatar',
      required: false,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      required: false,
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Quote Text',
      required: true,
    },
  ],
  interfaceName: 'QuoteBlock',
}
