import type { MDXEditorMethods, MDXEditorProps } from '@mdxeditor/editor'
import dynamic from 'next/dynamic'
import { forwardRef } from 'react'

const ClientMarkdownEditor = dynamic(
  () => import('./InitializedMarkdownEditor').then((module) => module.InitializedMarkdownEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-10" aria-hidden="true" />,
  }
)

/** Client-only MDXEditor boundary for Studio's Pages Router application. */
export const MarkdownEditor = forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => (
  <ClientMarkdownEditor {...props} editorRef={ref} />
))

MarkdownEditor.displayName = 'MarkdownEditor'
