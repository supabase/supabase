import { CodeNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { TRANSFORMERS } from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import type { Klass, LexicalNode } from 'lexical'

/**
 * [Joshen] Passthrough export here in case we want to expand more transformers
 * in the future - the default TRANSFORMERS cover the basics like headings, blockquotes,
 * lists, code blocks, links, and standard text formats.
 * If we'd like to support tables for example then we can expand this const
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
