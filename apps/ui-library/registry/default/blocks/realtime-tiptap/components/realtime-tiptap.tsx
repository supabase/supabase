'use client'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { useSupabaseCollaboration } from '../hooks/use-supabase-collaboration'
import { useMemo } from 'react'

export const RealtimeTiptapEditor = () => {
  const { SupabaseCollaboration, yDoc } = useSupabaseCollaboration({ channel: 'hello-world' })

  const extensions = useMemo(() => [StarterKit, SupabaseCollaboration], [SupabaseCollaboration])

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    // Initialize with empty content, the collaboration extension will sync the state
    content: '',
    // Enable collaboration features
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  })

  return (
    <div>
      <pre>
        {JSON.stringify(
          {
            yDoc,
          },
          null,
          2
        )}
      </pre>
      <EditorContent editor={editor} className="bg-gray-800 p-4 m-4" />
    </div>
  )
}
