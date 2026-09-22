import { CodeNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { TRANSFORMERS } from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import type { Klass, LexicalNode } from 'lexical'

/**
 * `@lexical/markdown`'s default TRANSFORMERS cover headings, blockquotes, ordered/unordered
 * lists, fenced code blocks, links, and the standard text formats (bold/italic/strikethrough/
 * inline code) — with no tables or task-list checkboxes. That's exactly this editor's supported
 * node set, so the defaults are used as-is rather than assembling a custom subset.
 */
export const MARKDOWN_TRANSFORMERS = TRANSFORMERS

export const MARKDOWN_EDITOR_NODES: Klass<LexicalNode>[] = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  LinkNode,
]
