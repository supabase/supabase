import { describe, expect, it } from 'vitest'

import rehypeAdmonitions from './rehype-admonitions.js'

// --- small helpers to build hast nodes by hand -----------------------
// (Mirrors what remark-rehype actually produces for:
//    > [!NOTE]
//    > Lorem ipsum dolor...
//  i.e. ONE blockquote containing ONE <p> whose text has an embedded
//  newline, plus whitespace text nodes between elements.)

function text(value: string): any {
  return { type: 'text', value }
}

function element(tagName: string, children: any[] = []): any {
  return { type: 'element', tagName, properties: {}, children }
}

function root(children: any[]): any {
  return { type: 'root', children }
}

function run(tree: any) {
  const transform = rehypeAdmonitions()
  transform(tree)
  return tree
}

// -----------------------------------------------------------------------

describe('rehypeAdmonitions', () => {
  it('converts a marked blockquote into an mdxJsxFlowElement Admonition', () => {
    const p = element('p', [text('[!NOTE]\nLorem ipsum dolor...')])
    const blockquote = element('blockquote', [text('\n'), p, text('\n')])
    const tree = root([blockquote])

    run(tree)

    const [admonition] = tree.children
    expect(admonition.type).toBe('mdxJsxFlowElement')
    expect(admonition.name).toBe('Admonition')
    expect(admonition.attributes).toEqual([
      { type: 'mdxJsxAttribute', name: 'type', value: 'note' },
    ])
  })

  it('strips the marker from the paragraph text and keeps the remaining body as children', () => {
    const p = element('p', [text('[!WARNING]\nSomething risky follows.')])
    const blockquote = element('blockquote', [text('\n'), p, text('\n')])
    const tree = root([blockquote])

    run(tree)

    const admonition = tree.children[0]
    const paragraph = admonition.children.find((c: any) => c.tagName === 'p')
    expect(paragraph.children[0].value).toBe('Something risky follows.')
    // the marker itself must be gone
    expect(paragraph.children[0].value).not.toContain('[!WARNING]')
  })

  it('maps a GFM alert type to its Admonition type', () => {
    const p = element('p', [text('[!TIP]\nUse the force.')])
    const blockquote = element('blockquote', [p])
    const tree = root([blockquote])

    run(tree)

    expect(tree.children[0].attributes[0].value).toBe('success')
  })

  it('preserves additional paragraphs inside the blockquote as extra children', () => {
    const firstP = element('p', [text('[!NOTE]\nFirst line.')])
    const secondP = element('p', [text('Second paragraph.')])
    const blockquote = element('blockquote', [text('\n'), firstP, text('\n'), secondP, text('\n')])
    const tree = root([blockquote])

    run(tree)

    const admonition = tree.children[0]
    const paragraphs = admonition.children.filter((c: any) => c.tagName === 'p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0].children[0].value).toBe('First line.')
    expect(paragraphs[1].children[0].value).toBe('Second paragraph.')
  })

  it('drops the first paragraph entirely if stripping the marker leaves it empty', () => {
    // > [!NOTE]
    // >
    // > Body lives in its own paragraph
    const firstP = element('p', [text('[!NOTE]')])
    const secondP = element('p', [text('Body lives in its own paragraph')])
    const blockquote = element('blockquote', [text('\n'), firstP, text('\n'), secondP, text('\n')])
    const tree = root([blockquote])

    run(tree)

    const admonition = tree.children[0]
    const paragraphs = admonition.children.filter((c: any) => c.tagName === 'p')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].children[0].value).toBe('Body lives in its own paragraph')
  })

  it('leaves an ordinary blockquote (no marker) completely untouched', () => {
    const p = element('p', [text('Just a normal quote, nothing special.')])
    const blockquote = element('blockquote', [text('\n'), p, text('\n')])
    const tree = root([blockquote])

    run(tree)

    expect(tree.children[0]).toBe(blockquote)
    expect(tree.children[0].type).toBe('element')
    expect(tree.children[0].tagName).toBe('blockquote')
  })

  it('ignores a blockquote whose first child is not a <p>', () => {
    const pre = element('pre', [text('[!NOTE]\nnot really a marker here')])
    const blockquote = element('blockquote', [pre])
    const tree = root([blockquote])

    run(tree)

    expect(tree.children[0]).toBe(blockquote)
  })

  it('ignores a blockquote whose paragraph has no leading text node', () => {
    const p = element('p', [element('code', [text('[!NOTE]')])])
    const blockquote = element('blockquote', [p])
    const tree = root([blockquote])

    run(tree)

    expect(tree.children[0]).toBe(blockquote)
  })

  it('does not touch text that merely contains brackets without the "[!" marker shape', () => {
    const p = element('p', [text('See [reference] for details.')])
    const blockquote = element('blockquote', [p])
    const tree = root([blockquote])

    run(tree)

    expect(tree.children[0].tagName).toBe('blockquote')
  })

  it('requires a closing "]" to treat something as a marker', () => {
    const p = element('p', [text('[!NOTE without a closing bracket')])
    const blockquote = element('blockquote', [p])
    const tree = root([blockquote])

    run(tree)

    expect(tree.children[0].tagName).toBe('blockquote')
  })

  it('finds and converts blockquotes nested arbitrarily deep in the tree', () => {
    const p = element('p', [text('[!DANGER]\nDeeply nested warning.')])
    const blockquote = element('blockquote', [p])
    const tree = root([element('div', [element('section', [blockquote])])])

    run(tree)

    const nested = tree.children[0].children[0].children[0]
    expect(nested.type).toBe('mdxJsxFlowElement')
    expect(nested.attributes[0].value).toBe('danger')
  })

  it('converts multiple independent admonitions in the same document', () => {
    const note = element('blockquote', [element('p', [text('[!NOTE]\nFirst.')])])
    const warning = element('blockquote', [element('p', [text('[!WARNING]\nSecond.')])])
    const tree = root([note, text('\n'), warning])

    run(tree)

    const [first, , second] = tree.children
    expect(first.attributes[0].value).toBe('note')
    expect(second.attributes[0].value).toBe('danger')
  })

  it('trims leading whitespace/newlines around the marker before matching', () => {
    const p = element('p', [text('  \n[!NOTE]\nIndented marker body.')])
    const blockquote = element('blockquote', [p])
    const tree = root([blockquote])

    run(tree)

    const admonition = tree.children[0]
    expect(admonition.attributes[0].value).toBe('note')
    expect(admonition.children[0].children[0].value).toBe('Indented marker body.')
  })
})
