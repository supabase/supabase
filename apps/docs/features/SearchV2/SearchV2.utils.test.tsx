import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { formatHeadingPath, highlightMatches } from './SearchV2.utils'

describe('formatHeadingPath', () => {
  it('joins multiple headings with " > "', () => {
    expect(formatHeadingPath(['Title 1', 'Title 2'])).toBe('Title 1 > Title 2')
  })

  it('returns a single-element path unchanged', () => {
    expect(formatHeadingPath(['Title 1'])).toBe('Title 1')
  })

  it('returns an empty string for an empty path', () => {
    expect(formatHeadingPath([])).toBe('')
  })
})

function renderHighlight(text: string, query: string) {
  const result = highlightMatches(text, query)
  if (typeof result === 'string') return { html: result, strongTexts: [] as string[] }

  const html = renderToStaticMarkup(<>{result}</>)
  const $ = load(html)
  return {
    html: $.root().text(),
    strongTexts: $('strong')
      .map((_, el) => $(el).text())
      .get(),
  }
}

describe('highlightMatches', () => {
  it('highlights a single case-insensitive partial match', () => {
    const result = highlightMatches('Bring your own MCP', 'mcp server')
    expect(typeof result).not.toBe('string')

    const { strongTexts, html } = renderHighlight('Bring your own MCP', 'mcp server')
    expect(strongTexts).toEqual(['MCP'])
    expect(html).toBe('Bring your own MCP')
  })

  it('highlights multiple non-overlapping token matches independently', () => {
    const { strongTexts } = renderHighlight('MCP servers for your server', 'mcp server')
    expect(strongTexts).toEqual(['MCP', 'server', 'server'])
  })

  it('merges overlapping/adjacent matches into a single run', () => {
    const { strongTexts } = renderHighlight('server', 'server serv')
    expect(strongTexts).toEqual(['server'])
  })

  it('returns the original string unchanged when there is no match', () => {
    const result = highlightMatches('Bring your own MCP', 'unrelated')
    expect(result).toBe('Bring your own MCP')
  })

  it('is case-insensitive but preserves the original casing of the matched text', () => {
    const { strongTexts } = renderHighlight('Bring your own MCP', 'MCP')
    expect(strongTexts).toEqual(['MCP'])
  })

  it('returns the text unchanged for an empty or whitespace-only query', () => {
    expect(highlightMatches('Bring your own MCP', '')).toBe('Bring your own MCP')
    expect(highlightMatches('Bring your own MCP', '   ')).toBe('Bring your own MCP')
  })

  it('excludes common prepositions/articles/conjunctions from highlighting', () => {
    const { strongTexts } = renderHighlight('The best MCP server for you', 'the mcp server')
    expect(strongTexts).toEqual(['MCP', 'server'])
  })

  it('returns the text unchanged when the query is made up entirely of ignored words', () => {
    const result = highlightMatches('The best MCP server', 'the of')
    expect(result).toBe('The best MCP server')
  })
})
