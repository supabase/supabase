import type { Field } from 'payload'

export const markdownField = (overrides?: Partial<Field>): Field[] => {
  return [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        components: {
          Field: '@/fields/MarkdownEditor/Component#MarkdownEditor',
        },
      },
      ...overrides,
    },
  ]
}
