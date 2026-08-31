import {
  codeBlockPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  useCodeBlockEditorContext,
  type CodeBlockEditorDescriptor,
  type CodeBlockEditorProps,
  type MDXEditorMethods,
  type MDXEditorProps,
} from '@mdxeditor/editor'
import { ChevronDown } from 'lucide-react'
import type { editor } from 'monaco-editor'
import { useEffect, useRef, type ForwardedRef } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import {
  CODE_BLOCK_LANGUAGES,
  getCodeBlockLanguage,
  getCodeEditorLanguage,
} from './MarkdownEditor.utils'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

interface InitializedMarkdownEditorProps extends MDXEditorProps {
  editorRef: ForwardedRef<MDXEditorMethods>
}

const NotebookCodeBlockEditor = ({ code, focusEmitter, language }: CodeBlockEditorProps) => {
  const { lexicalNode, parentEditor, setCode, setLanguage } = useCodeBlockEditorContext()
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null)
  const selectedLanguage = getCodeBlockLanguage(language)
  const languageLabel =
    CODE_BLOCK_LANGUAGES.find((candidate) => candidate.value === selectedLanguage)?.label ??
    selectedLanguage

  useEffect(() => {
    focusEmitter.subscribe(() => editorRef.current?.focus())
  }, [focusEmitter])

  return (
    <div
      className="not-prose my-4 overflow-hidden rounded-lg border bg-surface-75"
      onKeyDown={(event) => event.nativeEvent.stopImmediatePropagation()}
    >
      <div className="flex h-8 items-center border-b px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              contentEditable={false}
              tabIndex={0}
              className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-foreground-muted outline-none hover:bg-surface-200 hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground-muted"
            >
              {languageLabel}
              <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuRadioGroup value={selectedLanguage} onValueChange={setLanguage}>
              {CODE_BLOCK_LANGUAGES.map((candidate) => (
                <DropdownMenuRadioItem key={candidate.value} value={candidate.value}>
                  {candidate.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CodeEditor
        editorRef={editorRef}
        autofocus={false}
        className="h-36"
        hideLineNumbers
        language={getCodeEditorLanguage(language)}
        options={{ quickSuggestions: false, wordBasedSuggestions: 'off' }}
        value={code}
        onInputChange={(value) => setCode(value ?? '')}
        onMount={(editor) => {
          const editorElement = editor.getDomNode()
          if (!editorElement) return

          const removeEmptyCodeBlock = (event: KeyboardEvent) => {
            if (event.key === 'Backspace' && editor.getValue().length === 0) {
              parentEditor.update(() => lexicalNode.remove())
            }
          }

          // Capture before Monaco handles the key so deleting the last character keeps the block.
          editorElement.addEventListener('keydown', removeEmptyCodeBlock, true)
          editor.onDidDispose(() => {
            editorElement.removeEventListener('keydown', removeEmptyCodeBlock, true)
          })
        }}
      />
    </div>
  )
}

const notebookCodeBlockEditorDescriptor: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,
  Editor: NotebookCodeBlockEditor,
}

const notebookMarkdownPlugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  codeBlockPlugin({
    defaultCodeBlockLanguage: 'text',
    codeBlockEditorDescriptors: [notebookCodeBlockEditorDescriptor],
  }),
  markdownShortcutPlugin(),
]

/**
 * MDXEditor and its plugins must only be initialized in the browser. Import this component
 * through `MarkdownEditor`, which disables server rendering for this module.
 */
export function InitializedMarkdownEditor({ editorRef, ...props }: InitializedMarkdownEditorProps) {
  return <MDXEditor {...props} ref={editorRef} plugins={notebookMarkdownPlugins} />
}
