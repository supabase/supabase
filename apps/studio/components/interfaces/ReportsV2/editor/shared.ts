import { NodeViewProps } from '@tiptap/react'

export type TiptapNodeViewProps<T> = NodeViewProps & { node: { attrs: T } }
