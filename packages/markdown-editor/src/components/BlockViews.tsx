import { closeHistory, redo, undo } from 'prosemirror-history'
import type { Node as EditorNode } from 'prosemirror-model'
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import type { EditorView, NodeView } from 'prosemirror-view'
import { memo, useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import type { BlockEditorHandle, BlockSelection, MarkdownEditorProps } from '../types'
import { TextareaBlockEditor } from './TextareaBlockEditor'

interface BlockEntry {
  id: number
  dom: HTMLElement
  node: EditorNode
  selected: boolean
  view: EditorView
  getPos: () => number | undefined
}

export function createBlockStore() {
  let entries: readonly BlockEntry[] = []
  let nextId = 0
  const listeners = new Set<() => void>()
  const publish = () => listeners.forEach((listener) => listener())
  const update = (entry: BlockEntry) => {
    entries = entries.map((item) => (item.id === entry.id ? entry : item))
    publish()
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => entries,
    create(node: EditorNode, view: EditorView, getPos: () => number | undefined): NodeView {
      const dom = document.createElement('div')
      dom.contentEditable = 'false'
      dom.dataset.markdownBlock = node.attrs.kind
      let entry: BlockEntry = { id: nextId++, dom, node, view, getPos, selected: false }
      entries = [...entries, entry]
      publish()
      return {
        dom,
        update(nextNode) {
          if (nextNode.type !== node.type) return false
          entry = { ...entry, node: nextNode }
          dom.dataset.markdownBlock = nextNode.attrs.kind
          update(entry)
          return true
        },
        selectNode() {
          entry = { ...entry, selected: true }
          update(entry)
        },
        deselectNode() {
          entry = { ...entry, selected: false }
          update(entry)
        },
        stopEvent: (event) => event.type !== 'dragstart',
        ignoreMutation: () => true,
        destroy() {
          entries = entries.filter((item) => item.id !== entry.id)
          publish()
        },
      }
    },
  }
}

const Block = memo(function Block({
  entry,
  components,
  extensions,
  isReadOnly = false,
}: {
  entry: BlockEntry
} & Pick<MarkdownEditorProps, 'components' | 'extensions' | 'isReadOnly'>) {
  const handle = useRef<BlockEditorHandle>(null)
  const locallyFocusedNode = useRef<EditorNode | null>(null)
  const { view, getPos, node } = entry
  const { kind, value, language } = node.attrs
  const ExtensionEditor = extensions?.find((extension) => extension.type === kind)?.Editor
  const CodeEditor = kind === 'code' ? components?.CodeBlockEditor : undefined
  const Editor = ExtensionEditor ?? CodeEditor ?? TextareaBlockEditor

  useEffect(() => {
    if (!entry.selected) {
      locallyFocusedNode.current = null
      return
    }
    // Embedded editors own the caret during local input. Restore it only when
    // selection comes from the outer document or a history transaction.
    if (!isReadOnly && node !== locallyFocusedNode.current)
      handle.current?.focus(node.attrs.selection ?? { start: value.length, end: value.length })
  }, [entry.selected, isReadOnly, node, value])

  const onChange = (nextValue: string, selection?: BlockSelection) => {
    const pos = getPos()
    if (pos === undefined || isReadOnly || nextValue === value) return
    const tr = view.state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      value: nextValue,
      selection: selection ?? null,
    })
    locallyFocusedNode.current = tr.doc.nodeAt(pos)
    view.dispatch(tr)
  }
  const onFocus = () => {
    const pos = getPos()
    if (pos === undefined) return
    locallyFocusedNode.current = node
    view.dispatch(
      closeHistory(view.state.tr).setSelection(NodeSelection.create(view.state.doc, pos))
    )
  }
  const onRemove = () => {
    const pos = getPos()
    if (pos === undefined || isReadOnly || view.state.doc.nodeAt(pos)?.attrs.value !== '') return
    const tr = closeHistory(view.state.tr).replaceWith(
      pos,
      pos + node.nodeSize,
      view.state.schema.nodes.paragraph.create()
    )
    view.dispatch(tr.setSelection(TextSelection.create(tr.doc, pos + 1)).scrollIntoView())
    view.focus()
  }
  const onExit = (direction: 'before' | 'after') => {
    const pos = getPos()
    if (pos === undefined) return
    const after = direction === 'after'
    const boundary = after ? pos + node.nodeSize : pos
    const tr = view.state.tr
    const adjacent = after
      ? tr.doc.resolve(boundary).nodeAfter
      : tr.doc.resolve(boundary).nodeBefore
    if (!adjacent) tr.insert(boundary, view.state.schema.nodes.paragraph.create())
    tr.setSelection(
      Selection.near(tr.doc.resolve(after ? boundary : Math.max(0, boundary)), after ? 1 : -1)
    )
    view.dispatch(tr.scrollIntoView())
    view.focus()
  }
  const content = (
    <Editor
      value={value}
      language={language}
      isReadOnly={isReadOnly}
      editorRef={handle}
      onChange={onChange}
      onFocus={onFocus}
      onExit={onExit}
      onRemove={onRemove}
      onUndo={() => undo(view.state, view.dispatch)}
      onRedo={() => redo(view.state, view.dispatch)}
    />
  )
  return Editor === TextareaBlockEditor ? (
    <pre>
      <code>{content}</code>
    </pre>
  ) : (
    content
  )
})

export function BlockViews({
  store,
  ...props
}: {
  store: ReturnType<typeof createBlockStore>
} & Pick<MarkdownEditorProps, 'components' | 'extensions' | 'isReadOnly'>) {
  const entries = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return entries.map((entry) =>
    createPortal(<Block entry={entry} {...props} />, entry.dom, String(entry.id))
  )
}
