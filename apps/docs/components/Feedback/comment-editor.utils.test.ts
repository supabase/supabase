// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { createAttachment, movePill, readComment, type PillNodes } from './comment-editor.utils'

const createEditor = (html = ''): HTMLDivElement => {
  const editor = document.createElement('div')
  editor.innerHTML = html
  document.body.append(editor)
  return editor
}

const createPill = (): PillNodes => ({
  node: createAttachment(''),
  space: document.createTextNode(' '),
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('readComment', () => {
  it('reads br line breaks', () => {
    expect(readComment(createEditor('a<br>b'))).toBe('a\nb')
  })

  it('ignores the br that only holds an emptied or trailing line open', () => {
    expect(readComment(createEditor('<br>'))).toBe('')
    expect(readComment(createEditor('<div><br></div>'))).toBe('')
    expect(readComment(createEditor('a<br><br>'))).toBe('a\n')
  })

  it('reads div line breaks without a leading break', () => {
    expect(readComment(createEditor('<div>a</div><div>b</div>'))).toBe('a\nb')
    expect(readComment(createEditor('a<div>b</div>'))).toBe('a\nb')
  })

  it('does not double a line break before a div', () => {
    expect(readComment(createEditor('a\n<div>b</div>'))).toBe('a\nb')
  })

  it('skips inline attachments', () => {
    expect(readComment(createEditor('a<span data-inline-attachment>pin</span>b'))).toBe('ab')
  })
})

describe('movePill', () => {
  it('pads the pill with spaces when dropped mid-word', () => {
    const editor = createEditor()
    const pill = createPill()
    const target = document.createTextNode('cd')
    editor.append('ab', pill.node, pill.space, target)
    const range = document.createRange()
    range.setStart(target, 1)

    movePill({ pill, range })

    expect(readComment(editor)).toBe('abc  d')
    expect(pill.node.previousSibling?.textContent).toBe(' ')
    expect(pill.node.nextSibling).toBe(pill.space)
    expect(document.getSelection()?.anchorNode).toBe(pill.space)
  })

  it('reuses existing whitespace after the drop point', () => {
    const editor = createEditor()
    const pill = createPill()
    const target = document.createTextNode(' cd')
    editor.append(pill.node, pill.space, 'ab ', target)
    const range = document.createRange()
    range.setStartBefore(target)

    movePill({ pill, range })

    expect(readComment(editor)).toBe('ab  cd')
    expect(pill.space).toBe(target)
  })
})
