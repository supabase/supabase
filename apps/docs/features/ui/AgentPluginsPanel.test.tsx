// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useSearchParamsShallow } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AgentPluginsPanel } from './AgentPluginsPanel'
import { AGENT_CLIENT_PARAM } from './AgentPluginsPanel.data'

vi.mock('common', () => ({ useSearchParamsShallow: vi.fn() }))

const renderPanel = (search: string) => {
  const searchParams = new URLSearchParams(search)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    searchParams as unknown as ReturnType<typeof useSearchParamsShallow>
  )
  render(<AgentPluginsPanel />)
  return searchParams
}

describe('AgentPluginsPanel', () => {
  // cmdk and Radix lean on browser APIs jsdom doesn't ship
  beforeEach(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Element.prototype.scrollIntoView ??= () => {}
  })

  afterEach(cleanup)

  it('opens the instructions for the agent in the url', () => {
    renderPanel(`${AGENT_CLIENT_PARAM}=cursor`)

    expect(screen.getByRole('button', { name: /cursor/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /claude code/i })).toBeNull()
  })

  it('falls back to the first agent for an unknown agent in the url', () => {
    renderPanel(`${AGENT_CLIENT_PARAM}=not-an-agent`)

    expect(screen.getByRole('button', { name: /claude code/i })).toBeTruthy()
  })

  it('writes the picked agent to the url, so a copied link opens it', () => {
    const searchParams = renderPanel(`${AGENT_CLIENT_PARAM}=cursor`)

    fireEvent.click(screen.getByRole('button', { name: /cursor/i }))
    fireEvent.click(screen.getByRole('option', { name: /codex/i }))

    expect(searchParams.get(AGENT_CLIENT_PARAM)).toBe('codex')
  })
})
