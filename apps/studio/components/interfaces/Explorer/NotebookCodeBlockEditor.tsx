import type { OnMount } from '@monaco-editor/react'
import type { BlockEditorProps, BlockSelection } from 'markdown-editor/types'
import type { editor } from 'monaco-editor'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'

import { CodeEditor, type ValidLanguages } from '@/components/ui/CodeEditor/CodeEditor'
import { useLatest } from '@/hooks/misc/useLatest'

const languages = new Map<string, ValidLanguages>([
  ['sql', 'pgsql'],
  ['postgres', 'pgsql'],
  ['postgresql', 'pgsql'],
  ['pgsql', 'pgsql'],
  ['js', 'javascript'],
  ['javascript', 'javascript'],
  ['ts', 'typescript'],
  ['typescript', 'typescript'],
  ['json', 'json'],
  ['html', 'html'],
  ['css', 'css'],
  ['markdown', 'markdown'],
  ['md', 'markdown'],
])

function focusEditor(instance: editor.IStandaloneCodeEditor, selection?: BlockSelection) {
  instance.focus()
  const model = instance.getModel()
  if (selection && model) {
    const start = model.getPositionAt(selection.start)
    const end = model.getPositionAt(selection.end)
    instance.setSelection({
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    })
  }
}

export function NotebookCodeBlockEditor(props: BlockEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const latest = useLatest(props)
  const disposables = useRef<Array<{ dispose: () => void }>>([])
  const pendingFocus = useRef<{ selection?: BlockSelection } | null>(null)
  const [height, setHeight] = useState(80)

  useImperativeHandle(
    props.editorRef,
    () => ({
      focus(selection) {
        const instance = editorRef.current
        if (instance) focusEditor(instance, selection)
        else pendingFocus.current = { selection }
      },
    }),
    []
  )

  useEffect(() => () => disposables.current.forEach((item) => item.dispose()), [])

  const handleMount: OnMount = (instance, monaco) => {
    const { KeyCode, KeyMod } = monaco
    const atStart = instance.createContextKey<boolean>('markdownBlockAtStart', false)
    const atEnd = instance.createContextKey<boolean>('markdownBlockAtEnd', false)
    const updateBoundaries = () => {
      const model = instance.getModel()
      const selection = instance.getSelection()
      const offset =
        model && selection?.isEmpty() ? model.getOffsetAt(selection.getStartPosition()) : -1
      atStart.set(offset === 0)
      atEnd.set(offset >= 0 && offset === model?.getValueLength())
    }
    const updateHeight = () => setHeight(Math.max(60, instance.getContentHeight()))
    updateHeight()
    updateBoundaries()
    disposables.current.push(
      instance.onDidContentSizeChange(updateHeight),
      instance.onDidFocusEditorText(() => latest.current.onFocus()),
      instance.onDidChangeCursorSelection(updateBoundaries),
      instance.onDidChangeModelContent(updateBoundaries)
    )
    const navigation =
      'editorTextFocus && !suggestWidgetVisible && !findWidgetVisible && !inSnippetMode'
    const commands: Array<[number, () => void, string?]> = [
      [KeyMod.CtrlCmd | KeyCode.KeyZ, () => latest.current.onUndo()],
      [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ, () => latest.current.onRedo()],
      [KeyMod.CtrlCmd | KeyCode.KeyY, () => latest.current.onRedo()],
      [KeyCode.Escape, () => latest.current.onExit('after'), navigation],
      [KeyMod.CtrlCmd | KeyCode.Enter, () => latest.current.onExit('after')],
      [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter, () => latest.current.onExit('before')],
      [
        KeyCode.UpArrow,
        () => latest.current.onExit('before'),
        `${navigation} && markdownBlockAtStart`,
      ],
      [
        KeyCode.DownArrow,
        () => latest.current.onExit('after'),
        `${navigation} && markdownBlockAtEnd`,
      ],
      [
        KeyCode.Backspace,
        () => latest.current.onRemove(),
        `${navigation} && !editorReadonly && markdownBlockAtStart && markdownBlockAtEnd`,
      ],
    ]
    commands.forEach(([key, action, when = 'editorTextFocus']) =>
      instance.addCommand(key, action, when)
    )
    if (pendingFocus.current) {
      focusEditor(instance, pendingFocus.current.selection)
      pendingFocus.current = null
    }
  }

  return (
    <div
      className="not-prose my-3 overflow-hidden rounded-md border bg-surface-100"
      style={{ height }}
    >
      <CodeEditor
        editorRef={editorRef}
        language={languages.get(props.language.toLowerCase()) ?? 'plaintext'}
        value={props.value}
        autofocus={false}
        isReadOnly={props.isReadOnly}
        hideLineNumbers
        className="h-full"
        actions={{
          formatDocument: { enabled: false, callback: () => {} },
          placeholderFill: { enabled: false },
        }}
        options={{
          ariaLabel: props.language ? `${props.language} code block` : 'Code block',
          tabFocusMode: true,
        }}
        onMount={handleMount}
        onInputChange={(value) => {
          const instance = editorRef.current
          const model = instance?.getModel()
          const selection = instance?.getSelection()
          props.onChange(
            value ?? '',
            model && selection
              ? {
                  start: model.getOffsetAt(selection.getStartPosition()),
                  end: model.getOffsetAt(selection.getEndPosition()),
                }
              : undefined
          )
        }}
      />
    </div>
  )
}
