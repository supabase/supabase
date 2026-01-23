import type { Block } from 'payload'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'SQL',
          value: 'sql',
        },
        {
          label: 'JSON',
          value: 'json',
        },
        {
          label: 'bash',
          value: 'bash',
        },
        {
          label: 'Javascript',
          value: 'js',
        },
        {
          label: 'Typescript',
          value: 'ts',
        },
        {
          label: 'tsx',
          value: 'tsx',
        },
        {
          label: 'Python',
          value: 'py',
        },
        {
          label: 'kotlin',
          value: 'kotlin',
        },
        {
          label: 'yaml',
          value: 'yaml',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}
