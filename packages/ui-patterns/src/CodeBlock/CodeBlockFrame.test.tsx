import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CodeBlockFrame, CodeBlockTokens, type CodeToken } from './CodeBlockFrame'

const LINES: Array<Array<CodeToken>> = [
  [
    ['const ', 's-k'],
    ["html = '<b>&amp;</b>'", 's-s'],
  ],
  [],
  [['// done', 's-c s-i']],
]
const SOURCE = "const html = '<b>&amp;</b>'\n\n// done"

const renderFrame = (lineNumbers: boolean) => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(
    <CodeBlockFrame lang="ts" lineCount={LINES.length}>
      <CodeBlockTokens lines={LINES} lineNumbers={lineNumbers} />
    </CodeBlockFrame>
  )
  return container
}

describe('CodeBlockFrame', () => {
  it('renders readable, escaped, numbered code without controls or nested pre', () => {
    const container = renderFrame(true)
    const lines = [...container.querySelectorAll('.code-line-content')].map((el) => el.textContent)

    expect(lines.join('\n')).toBe(SOURCE)
    expect(
      [...container.querySelectorAll('.code-line-number')].map((el) => el.textContent)
    ).toEqual(['1', '2', '3'])
    expect(container.querySelectorAll('pre')).toHaveLength(1)
    expect(container.querySelector('pre pre')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('.code-scroll')).toHaveAttribute(
      'aria-label',
      'TypeScript, 3 lines'
    )
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('keeps gutters out of the unnumbered layout', () => {
    const container = renderFrame(false)
    const lines = [...container.querySelectorAll('.code-content > span')].map(
      (el) => el.textContent
    )

    expect(lines.join('\n')).toBe(SOURCE)
    expect(container.querySelector('.code-line-number')).toBeNull()
  })
})
