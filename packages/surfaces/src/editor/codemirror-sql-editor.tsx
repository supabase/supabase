import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { PostgreSQL, sql, StandardSQL } from '@codemirror/lang-sql'
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language'
import { Annotation, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { cn } from 'ui'

import type { SqlEditorProps } from '../query/sql-editor'

/**
 * A light SQL editor for hosts that cannot load Monaco (MCP Apps run as one
 * self-contained document with no workers). Studio passes Monaco instead.
 */
const externalUpdate = Annotation.define<boolean>()

const highlighting = HighlightStyle.define([
  { tag: tags.keyword, color: 'hsl(var(--code-block-1))' },
  { tag: tags.string, color: 'hsl(var(--code-block-2))' },
  { tag: [tags.number, tags.bool, tags.null], color: 'hsl(var(--code-block-3))' },
  { tag: tags.comment, color: 'var(--tertiary-foreground)', fontStyle: 'italic' },
  { tag: [tags.typeName, tags.standard(tags.name)], color: 'hsl(var(--code-block-4))' },
  { tag: tags.operator, color: 'hsl(var(--code-block-5))' },
])

const theme = EditorView.theme({
  '&': {
    fontSize: '13px',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', padding: '8px 0' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--foreground-muted)',
  },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--background-selection)',
  },
  '.cm-placeholder': { color: 'var(--foreground-muted)' },
})

export function CodeMirrorSqlEditor({
  value,
  source,
  onChange,
  onRun,
  readOnly = false,
  className,
}: SqlEditorProps) {
  const container = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const callbacks = useRef({ onChange, onRun })
  useLayoutEffect(() => {
    callbacks.current = { onChange, onRun }
  })

  useEffect(() => {
    const run = () => {
      callbacks.current.onRun()
      return true
    }
    const editor = new EditorView({
      parent: container.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          indentUnit.of('  '),
          EditorState.tabSize.of(2),
          EditorState.readOnly.of(readOnly),
          sql({ dialect: source === 'database' ? PostgreSQL : StandardSQL }),
          syntaxHighlighting(highlighting),
          theme,
          EditorView.lineWrapping,
          placeholder('Write a SQL query…'),
          EditorView.contentAttributes.of({ 'aria-label': 'SQL query', spellcheck: 'false' }),
          keymap.of([{ key: 'Mod-Enter', run }, indentWithTab, ...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update) => {
            if (
              update.docChanged &&
              !update.transactions.some((tr) => tr.annotation(externalUpdate))
            ) {
              callbacks.current.onChange(update.state.doc.toString())
            }
          }),
        ],
      }),
    })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = null
    }
    // The editor owns its selection and history; value changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, readOnly])

  useEffect(() => {
    const editor = view.current
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
        annotations: externalUpdate.of(true),
      })
    }
  }, [value])

  return <div ref={container} className={cn('min-h-[72px] overflow-auto', className)} />
}
