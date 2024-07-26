import { NodeViewProps } from '@tiptap/react'

export type TiptapNodeViewProps<T> = NodeViewProps & { node: { attrs: T } }

export const BLOCKS = [
  {
    type: 'input',
    label: 'Input',
  },
  {
    type: 'json',
    label: 'JSON',
  },
  {
    type: 'table',
    label: 'Table',
  },
  {
    type: 'chart',
    label: 'Chart',
  },
] as const

export type Block = (typeof BLOCKS)[number]
export type BlockType = Block['type']
