import { history } from 'prosemirror-history'
import { Slice } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import type { createBlockStore } from './components/BlockViews'
import { editingPlugins } from './extensions/commands'
import { exportMarkdown } from './markdown/export'
import { importMarkdown } from './markdown/import'
import { markdownSchema } from './schema'
import type { MarkdownEditorProps } from './types'

export function createMarkdownView(
  mount: HTMLElement,
  getProps: () => MarkdownEditorProps,
  blocks: ReturnType<typeof createBlockStore>
) {
  const extensions = getProps().extensions ?? []
  const names = new Set(['code', 'source'])
  for (const extension of extensions) {
    if (names.has(extension.type))
      throw new Error(`Duplicate Markdown block type: ${extension.type}`)
    names.add(extension.type)
  }
  let source = getProps().markdown
  let sourceDoc = importMarkdown(source, extensions)
  let pending = false
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let maximumTimer: ReturnType<typeof setTimeout> | undefined
  const plugins = [...editingPlugins(), history()]
  const getMarkdown = () =>
    view.state.doc.eq(sourceDoc) ? source : exportMarkdown(view.state.doc, extensions)
  const clearTimers = () => {
    clearTimeout(idleTimer)
    clearTimeout(maximumTimer)
    idleTimer = maximumTimer = undefined
  }
  const flush = () => {
    clearTimers()
    if (!pending) return source
    const markdown = getMarkdown()
    pending = false
    const changed = markdown !== source
    source = markdown
    sourceDoc = view.state.doc
    if (changed) getProps().onChange(markdown)
    return markdown
  }
  const view = new EditorView(
    { mount },
    {
      state: EditorState.create({ schema: markdownSchema, doc: sourceDoc, plugins }),
      editable: () => !getProps().isReadOnly,
      attributes: () => ({
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-readonly': String(!!getProps().isReadOnly),
        'aria-label': getProps()['aria-label'],
        'data-markdown-editor': '',
        class: `whitespace-pre-wrap break-words ${getProps().className ?? ''}`,
      }),
      nodeViews: { embedded_block: (node, view, getPos) => blocks.create(node, view, getPos) },
      dispatchTransaction(transaction) {
        if (getProps().isReadOnly && transaction.docChanged) return
        const next = view.state.applyTransaction(transaction)
        view.updateState(next.state)
        if (!next.transactions.some((tr) => tr.docChanged)) return
        pending = true
        getProps().onDirty?.()
        clearTimeout(idleTimer)
        idleTimer = setTimeout(flush, 250)
        maximumTimer ??= setTimeout(flush, 1000)
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return true
        const doc = importMarkdown(text, extensions)
        const paragraph = doc.childCount === 1 ? doc.firstChild : null
        const inline =
          paragraph?.type === markdownSchema.nodes.paragraph && paragraph.childCount === 1
            ? paragraph.firstChild
            : null
        const tr =
          inline?.isText && inline.marks.length === 0
            ? view.state.tr.replaceSelectionWith(inline)
            : view.state.tr.replaceSelection(Slice.maxOpen(doc.content))
        view.dispatch(tr.scrollIntoView())
        return true
      },
      clipboardTextSerializer(slice) {
        const content = slice.content.firstChild?.isInline
          ? markdownSchema.nodes.paragraph.create(null, slice.content)
          : slice.content
        const doc = markdownSchema.nodes.doc.create(null, content)
        return (
          exportMarkdown(doc, extensions) || slice.content.textBetween(0, slice.content.size, '\n')
        )
      },
      handleDOMEvents: {
        focusout: (_view, event) => {
          if (!(event.relatedTarget instanceof Node) || !mount.contains(event.relatedTarget))
            flush()
          return false
        },
      },
    }
  )
  const handleVisibility = () => {
    if (document.hidden) flush()
  }
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('pagehide', flush)

  return {
    view,
    getMarkdown,
    flush,
    focus: () => view.focus(),
    receive(markdown: string) {
      view.setProps({})
      if (markdown === source) return
      if (pending) {
        getProps().onConflict?.(markdown)
        return
      }
      source = markdown
      sourceDoc = importMarkdown(markdown, extensions)
      view.updateState(EditorState.create({ schema: markdownSchema, doc: sourceDoc, plugins }))
    },
    destroy() {
      flush()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', flush)
      view.destroy()
    },
  }
}
