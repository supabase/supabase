import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { describe, expect, it } from 'vitest'

import { stripHeadingCustomIds } from './helpers'

describe('stripHeadingCustomIds', () => {
  it.each([
    ['### Step [#1]: Accessing items[0]', '### Step \\[#1]: Accessing items\\[0]\n'],
    ['## Issue [#123] [Beta]', '## Issue \\[#123] \\[Beta]\n'],
    ['## Issue [#123] [#issue]', '## Issue \\[#123]\n'],
    ['## A heading [#custom-id]', '## A heading\n'],
    ['## A heading [#custom-id]  ', '## A heading\n'],
    ['## Using `createClient` [#create-client]', '## Using `createClient`\n'],
    ['## Arrays [#1] explained', '## Arrays \\[#1] explained\n'],
  ])('exports %s without removing heading text', (input, expected) => {
    const tree = fromMarkdown(input)

    stripHeadingCustomIds(tree)

    expect(toMarkdown(tree)).toBe(expected)
  })
})
