import type { Field, TextareaField } from 'payload'

export const markdownField = (overrides?: Partial<TextareaField>): Field[] => {
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
    } as TextareaField,
  ]
}
