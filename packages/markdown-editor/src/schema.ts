import { Schema } from 'prosemirror-model'
import { bulletList, listItem, orderedList } from 'prosemirror-schema-list'

import { isSafeLink } from './markdown/parse'

export const markdownSchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM: () => ['p', 0],
    },
    text: { group: 'inline' },
    heading: {
      content: 'inline*',
      group: 'block',
      defining: true,
      attrs: { level: { default: 1 } },
      parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({ tag: `h${level}`, attrs: { level } })),
      toDOM: (node) => [`h${node.attrs.level}`, 0],
    },
    blockquote: {
      content: 'block+',
      group: 'block',
      defining: true,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0],
    },
    bullet_list: { ...bulletList, content: 'list_item+', group: 'block' },
    ordered_list: { ...orderedList, content: 'list_item+', group: 'block' },
    list_item: { ...listItem, content: 'paragraph block*', defining: true },
    hard_break: {
      inline: true,
      group: 'inline',
      selectable: false,
      attrs: { soft: { default: false } },
      parseDOM: [{ tag: 'br' }],
      toDOM: () => ['br'],
    },
    embedded_block: {
      group: 'block',
      atom: true,
      isolating: true,
      draggable: false,
      attrs: {
        kind: { default: 'code' },
        value: { default: '' },
        language: { default: '' },
        selection: { default: null },
      },
      toDOM: (node) => [
        'pre',
        { 'data-markdown-block': node.attrs.kind },
        ['code', node.attrs.value],
      ],
      leafText: (node) => node.attrs.value,
    },
  },
  marks: {
    strong: { parseDOM: [{ tag: 'strong' }, { tag: 'b' }], toDOM: () => ['strong', 0] },
    em: { parseDOM: [{ tag: 'em' }, { tag: 'i' }], toDOM: () => ['em', 0] },
    code: { code: true, excludes: '', parseDOM: [{ tag: 'code' }], toDOM: () => ['code', 0] },
    link: {
      attrs: { href: {}, title: { default: null } },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: (element) => {
            const href = element.getAttribute('href') ?? ''
            return isSafeLink(href) ? { href, title: element.getAttribute('title') } : false
          },
        },
      ],
      toDOM: (node) => [
        'a',
        { href: node.attrs.href, title: node.attrs.title, rel: 'noopener noreferrer' },
        0,
      ],
    },
  },
})
