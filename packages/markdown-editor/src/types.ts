import type { RootContent } from 'mdast'
import type { ComponentType, Ref } from 'react'

export interface BlockSelection {
  start: number
  end: number
}

export interface BlockEditorHandle {
  focus: (selection?: BlockSelection) => void
}

export interface BlockEditorProps {
  value: string
  language: string
  isReadOnly: boolean
  editorRef: Ref<BlockEditorHandle>
  onChange: (value: string, selection?: BlockSelection) => void
  onFocus: () => void
  onUndo: () => void
  onRedo: () => void
  onExit: (direction: 'before' | 'after') => void
  /** Replace an empty block with a paragraph and return focus to the document. */
  onRemove: () => void
}

/** Extensions are leaf blocks. Their source must be valid, reversible Markdown. */
export interface MarkdownBlockExtension {
  type: string
  parse: (node: RootContent, source: string) => { value: string; language?: string } | null
  serialize: (block: { value: string; language: string }) => string
  Editor: ComponentType<BlockEditorProps>
}

export interface MarkdownEditorHandle {
  focus: () => void
  getMarkdown: () => string
  flush: () => string
}

export interface MarkdownEditorProps {
  markdown: string
  onChange: (markdown: string) => void
  /** Called immediately for document edits, before debounced serialization. */
  onDirty?: () => void
  /** A divergent external value arrived while local edits were pending. */
  onConflict?: (incomingMarkdown: string) => void
  className?: string
  'aria-label': string
  isReadOnly?: boolean
  ref?: Ref<MarkdownEditorHandle>
  components?: { CodeBlockEditor?: ComponentType<BlockEditorProps> }
  /** Keep extension definitions stable for the lifetime of the editor. */
  extensions?: readonly MarkdownBlockExtension[]
}
