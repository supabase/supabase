import { createHeadlessEditor } from '@lexical/headless'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { describe, expect, it } from 'vitest'

import { MARKDOWN_EDITOR_NODES, MARKDOWN_TRANSFORMERS } from './MarkdownEditor.utils'

function roundTrip(markdown: string): string {
  const editor = createHeadlessEditor({
    nodes: MARKDOWN_EDITOR_NODES,
    onError: (error) => {
      throw error
    },
  })
  editor.update(() => $convertFromMarkdownString(markdown, MARKDOWN_TRANSFORMERS), {
    discrete: true,
  })

  let result = ''
  editor.getEditorState().read(() => {
    result = $convertToMarkdownString(MARKDOWN_TRANSFORMERS)
  })
  return result
}

describe('MarkdownEditor markdown <-> editor state round trip', () => {
  it.each([
    ['heading', '# Heading one'],
    ['sub-heading', '## Heading two'],
    ['bold', 'Some **bold** text'],
    ['italic', 'Some *italic* text'],
    ['strikethrough', 'Some ~~struck out~~ text'],
    ['inline code', 'Some `inline code` text'],
    ['blockquote', '> A quote'],
    ['unordered list', '- one\n- two\n- three'],
    ['ordered list', '1. one\n2. two\n3. three'],
    ['link', '[Supabase](https://supabase.com)'],
    ['fenced code block', '```\nconst x = 1\n```'],
    ['fenced code block with language', '```ts\nconst x = 1\n```'],
  ])('round-trips %s unchanged', (_name, markdown) => {
    expect(roundTrip(markdown)).toBe(markdown)
  })

  it('is idempotent on a second round trip', () => {
    const markdown =
      '# Title\n\nSome **bold** and *italic* text with a [link](https://supabase.com).\n\n- one\n- two'
    const once = roundTrip(markdown)
    const twice = roundTrip(once)
    expect(twice).toBe(once)
  })
})
