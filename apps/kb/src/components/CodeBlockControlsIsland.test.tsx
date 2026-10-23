// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CodeBlockControlsIsland } from './CodeBlockControlsIsland'

const SOURCES = ['select 1', 'echo "<hi>"']

const writeText = vi.fn<(text: string) => Promise<void>>()

// these frames match the output of shiki-code-block.ts. that output keeps the copy text separate from the rendered code
const seedFrames = (sources: Array<string>) => {
  for (const source of sources) {
    const frame = document.createElement('div')
    frame.className = 'shiki'
    frame.dataset.codeSource = source
    frame.innerHTML = '<div class="code-scroll"><pre><code>1 decorated text</code></pre></div>'
    document.body.append(frame)
  }
  return [...document.querySelectorAll<HTMLElement>('.shiki')]
}

const mountIsland = () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  act(() => root.render(<CodeBlockControlsIsland />))
  return root
}

describe('CodeBlockControlsIsland', () => {
  let root: Root | undefined

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    writeText.mockReset().mockResolvedValue()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
  })

  it('mounts one set of controls into each frame and copies that frame’s own source', async () => {
    const frames = seedFrames(SOURCES)
    root = mountIsland()

    for (const [idx, frame] of frames.entries()) {
      const copy = frame.querySelectorAll<HTMLButtonElement>('button[aria-label="Copy code"]')
      expect(copy).toHaveLength(1)
      await act(async () => copy[0].click())
      expect(writeText).toHaveBeenLastCalledWith(SOURCES[idx])
    }
  })

  it('toggles wrapping on its own frame only', () => {
    const [first, second] = seedFrames(SOURCES)
    root = mountIsland()

    act(() =>
      first.querySelector<HTMLButtonElement>('button[aria-label="Enable word wrap"]')?.click()
    )

    expect(first.querySelector(":scope > [data-wrapped='true']")).not.toBeNull()
    expect(second.querySelector(":scope > [data-wrapped='true']")).toBeNull()
  })

  it('renders nothing without frames and removes its controls on unmount', () => {
    const [frame] = seedFrames(SOURCES.slice(0, 1))
    root = mountIsland()
    expect(frame.querySelector('button')).not.toBeNull()

    act(() => root?.unmount())
    root = undefined
    expect(frame.querySelector('button')).toBeNull()
    expect(frame.textContent).toContain('decorated text')

    document.body.innerHTML = ''
    root = mountIsland()
    expect(document.querySelector('button')).toBeNull()
  })
})
