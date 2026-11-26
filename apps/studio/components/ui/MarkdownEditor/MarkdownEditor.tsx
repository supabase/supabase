import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  registerMarkdownShortcuts,
} from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import type { LexicalEditor } from 'lexical'
import { useEffect, useRef, type RefObject } from 'react'
import { cn } from 'ui'

import { markdownEditorTheme } from './MarkdownEditor.theme'
import { MARKDOWN_EDITOR_NODES, MARKDOWN_TRANSFORMERS } from './MarkdownEditor.utils'

interface MarkdownEditorProps {
  value: string
  onChange?: (markdown: string) => void
  onBlur?: (markdown: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

const MarkdownClassName = cn(
  'outline-none',
  'prose prose-sm max-w-none px-3 py-2 text-muted-foreground prose-headings:text-foreground',
  '[&>h1]:mb-2 [&>h2]:mb-2',
  '[&_ol>li]:pl-3 [&_ol>li]:my-0',
  '[&_ul>li]:my-0',
  '[--tw-prose-body:var(--foreground-muted)]',
  '[--tw-prose-headings:var(--foreground-default)]',
  '[--tw-prose-links:var(--foreground-muted)]',
  '[--tw-prose-bold:var(--foreground-muted)]',
  '[--tw-prose-quotes:var(--foreground-muted)]'
)

const EDITOR_OWNED_SHORTCUT_KEYS = new Set(['b', 'i', 'u', 'z'])

const isEditorOwnedShortcut = (event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'key'>) =>
  (event.metaKey || event.ctrlKey) && EDITOR_OWNED_SHORTCUT_KEYS.has(event.key.toLowerCase())

const EditorKeyboardShortcutsPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregisterMarkdownShortcuts = registerMarkdownShortcuts(editor, MARKDOWN_TRANSFORMERS)

    /**
     * [Joshen] This just ensures that the markdown editor shortcuts take precedence.
     * e.g Cmd+I to italicize a text should not toggle the inline editor panel
     */
    const unregisterRootListener = editor.registerRootListener((rootElement) => {
      if (!rootElement) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (isEditorOwnedShortcut(event)) event.stopPropagation()
      }
      rootElement.addEventListener('keydown', handleKeyDown)
      return () => rootElement.removeEventListener('keydown', handleKeyDown)
    })

    return () => {
      unregisterMarkdownShortcuts()
      unregisterRootListener()
    }
  }, [editor])

  return null
}

const SyncExternalValuePlugin = ({
  value,
  isFocused,
  lastKnownValueRef,
}: {
  value: string
  isFocused: () => boolean
  lastKnownValueRef: RefObject<string>
}) => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value === lastKnownValueRef.current || isFocused()) return
    lastKnownValueRef.current = value
    editor.update(() => $convertFromMarkdownString(value, MARKDOWN_TRANSFORMERS))
  }, [editor, value, isFocused, lastKnownValueRef])

  return null
}

/**
 * [Joshen] Deliberately omitted support for MD tables for now, can investigate separately
 * Also deliberately having this in components/ui for now since Explorer is its only consumer
 * Can shift to packages/ui if deem necessary (e.g if a second consumer needs it - e.g
 * TextEditor in the side panel for the table editor when editing a text cell)
 */
export const MarkdownEditor = ({
  value,
  onChange,
  onBlur,
  placeholder,
  autoFocus,
  className,
}: MarkdownEditorProps) => {
  const isFocusedRef = useRef(false)
  const editorRef = useRef<LexicalEditor | null>(null)
  const lastKnownValueRef = useRef(value)

  const initialConfig = {
    namespace: 'MarkdownEditor',
    theme: markdownEditorTheme,
    nodes: MARKDOWN_EDITOR_NODES,
    onError: (error: Error) => {
      throw error
    },
    editorState: () => $convertFromMarkdownString(value, MARKDOWN_TRANSFORMERS),
  }

  const handleBlur = () => {
    isFocusedRef.current = false
    if (!onBlur) return
    editorRef.current?.getEditorState().read(() => {
      const markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS)
      lastKnownValueRef.current = markdown
      onBlur(markdown)
    })
  }

  const placeholderProps = placeholder
    ? {
        'aria-placeholder': placeholder,
        placeholder: (
          <div className="pointer-events-none absolute top-[11px] left-3 inset-0 text-sm italic text-foreground-lighter">
            {placeholder}
          </div>
        ),
      }
    : { 'aria-placeholder': undefined, placeholder: null }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorRefPlugin editorRef={editorRef} />
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              autoFocus={autoFocus}
              className={cn(MarkdownClassName, className)}
              onFocus={() => {
                isFocusedRef.current = true
              }}
              onBlur={handleBlur}
              {...placeholderProps}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <EditorKeyboardShortcutsPlugin />
        <SyncExternalValuePlugin
          value={value}
          isFocused={() => isFocusedRef.current}
          lastKnownValueRef={lastKnownValueRef}
        />
        {onChange && (
          <OnChangePlugin
            onChange={(editorState) =>
              editorState.read(() => {
                const markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS)
                lastKnownValueRef.current = markdown
                onChange(markdown)
              })
            }
          />
        )}
      </div>
    </LexicalComposer>
  )
}
