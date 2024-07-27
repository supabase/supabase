'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { SupaBlock } from './supa-block'
import { SupaInput } from './supa-input'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import { SlashCommand, getSlashCommandSuggestions } from './slash-commands'
import { TrailingNode } from './trailing-node'
import Placeholder from '@tiptap/extension-placeholder'

// to get local storage in SSR
const ls = typeof window !== 'undefined' ? window.localStorage : null

export function SupaEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      SupaBlock,
      SupaInput,
      GlobalDragHandle,
      SlashCommand.configure({
        suggestion: getSlashCommandSuggestions([]),
      }),
      TrailingNode,
      Placeholder.configure({
        placeholder: 'Type a slash / to see suggestions',
      }),
    ],
    onTransaction: ({ transaction, editor }) => {
      // if the transaction is trying to delete a supa-block, prevent it.
      if (transaction.steps.some((step) => step.toJSON().stepType === 'delete')) {
        return false
      }
      return true
    },
    content: JSON.parse(ls?.getItem('editorContent') || '{}'),
    onUpdate: ({ editor }) => {
      ls?.setItem('editorContent', JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      handleDOMEvents: {
        keydown: (view, event) => {
          // if slash command is open, don't handle keydown events
          if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            const slashCommand = document.querySelector('#slash-command')
            if (slashCommand) {
              return true
            }
          }
        },
      },
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mx-auto max-w-full flex flex-col min-h-screen">
        <EditorContent
          className="p-4 prose-sm prose-headings:font-medium prose-headings:mt-4"
          editor={editor}
        />
        <div
          className="flex-1 cursor-text"
          onClick={() => {
            editor?.commands.focus('end')
          }}
        ></div>
      </div>
      {/* <div className="text-center">
        <h2 className="font-medium text-sm mt-8 mb-2">Add blocks</h2>
        <div className="flex gap-2 *:flex-1 *:p-2 font-medium *:border">
          <button
            onClick={() =>
              editor?.commands.insertContentAt(
                getEditorLength(),
                "<div data-type='draggable-item'><sql-table sql='SELECT * FROM users'></sql-table><p></p></div>"
              )
            }
          >
            Table
          </button>
          <button
            onClick={() => editor?.commands.insertContentAt(getEditorLength(), '<h2>Title</h2>')}
          >
            Text
          </button>
          <button
            onClick={() =>
              editor?.commands.insertContentAt(getEditorLength(), "<chart type='line'></chart>")
            }
          >
            Chart
          </button>
          <button
            onClick={() =>
              editor?.commands.insertContentAt(getEditorLength(), '<counter></counter>')
            }
          >
            Counter
          </button>
        </div>
      </div>*/}
      <pre className="mt-24 border-t">{JSON.stringify(editor?.getJSON(), null, 2)}</pre>
    </div>
  )
}
