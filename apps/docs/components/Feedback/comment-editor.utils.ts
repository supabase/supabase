import { cn } from 'ui'

export interface PillNodes {
  node: HTMLSpanElement
  space: Text
}

export const ATTACHMENT_SELECTOR = '[data-inline-attachment]'

export const focusCommentEditor = (editor: HTMLElement | null) => {
  if (!editor) return
  editor.focus()
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  setCaret({ node: range.startContainer, offset: range.startOffset })
}

export const readComment = (root: Node): string =>
  Array.from(root.childNodes).reduce((text, node) => {
    if (node.nodeType === Node.TEXT_NODE) return `${text}${node.textContent ?? ''}`
    if (!(node instanceof HTMLElement) || node.matches(ATTACHMENT_SELECTOR)) return text
    if (node.tagName === 'BR') return node.nextSibling ? `${text}\n` : text
    const lineBreak = node.tagName === 'DIV' && text !== '' && !text.endsWith('\n') ? '\n' : ''
    return `${text}${lineBreak}${readComment(node)}`
  }, '')

export const movePill = ({ pill, range }: { pill: PillNodes; range: Range }) => {
  if (pill.space.isConnected && pill.space.data === ' ') pill.space.remove()
  pill.node.remove()
  range.collapse(true)
  range.insertNode(pill.node)

  const before = pill.node.previousSibling
  if (before instanceof Text && !/\s$/.test(before.data)) pill.node.before(' ')
  const after = pill.node.nextSibling
  if (after instanceof Text && /^\s/.test(after.data)) {
    pill.space = after
  } else {
    pill.space = document.createTextNode(' ')
    pill.node.after(pill.space)
  }
  setCaret({ node: pill.space, offset: 1 })
}

export const createGhost = (pillNode: HTMLElement): HTMLElement => {
  const ghost = pillNode.cloneNode(true)
  if (!(ghost instanceof HTMLElement)) throw new Error('Expected an element clone')
  delete ghost.dataset.inlineAttachment
  ghost.removeAttribute('data-selected')
  ghost.setAttribute('aria-hidden', 'true')
  ghost.className = cn(pillNode.className, 'pointer-events-none opacity-50')
  ghost.querySelectorAll('[tabindex]').forEach((node) => node.setAttribute('tabindex', '-1'))
  return ghost
}

export const isNextToPill = ({ range, pill }: { range: Range; pill: PillNodes }): boolean => {
  const { startContainer: node, startOffset: offset } = range
  const last =
    pill.space.isConnected && pill.space.previousSibling === pill.node ? pill.space : pill.node
  if (node instanceof Text && offset === node.length && node.nextSibling === pill.node) return true
  if (node instanceof Text && offset === 0 && node.previousSibling === last) return true
  const around = document.createRange()
  around.setStartBefore(pill.node)
  around.setEndAfter(last)
  return around.isPointInRange(node, offset)
}

export const getCaretRangeAt = ({ x, y }: { x: number; y: number }): Range | null => {
  if (typeof document.caretPositionFromPoint === 'function') {
    const position = document.caretPositionFromPoint(x, y)
    if (!position) return null
    const range = document.createRange()
    range.setStart(position.offsetNode, position.offset)
    return range
  }
  return document.caretRangeFromPoint?.(x, y) ?? null
}

export const createAttachment = (className: string): HTMLSpanElement => {
  const node = document.createElement('span')
  node.contentEditable = 'false'
  node.dataset.inlineAttachment = ''
  node.className = className
  return node
}

export const insertAtCaret = ({
  editor,
  node,
  caret,
}: {
  editor: HTMLElement
  node: Node
  caret: Range | null
}) => {
  if (!caret || !editor.contains(caret.startContainer)) {
    editor.append(node)
    return
  }
  caret.collapse(false)
  caret.insertNode(node)
}

export const setCaret = ({ node, offset }: { node: Node; offset: number }) => {
  const selection = document.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

export const isInsideAttachment = (node: Node): boolean =>
  (node instanceof Element ? node : node.parentElement)?.closest(ATTACHMENT_SELECTOR) != null
