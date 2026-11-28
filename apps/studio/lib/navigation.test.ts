// @vitest-environment jsdom
import type { UseNavigateResult } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createNavigationHandler, navigateToUrl } from './navigation'

type NavigationEvent = Parameters<ReturnType<typeof createNavigationHandler>>[0]
type Outcome = 'push' | 'new-tab' | 'none'

describe('createNavigationHandler', () => {
  const URL = '/project/123/settings'
  const navigate = vi.fn()
  const windowOpen = vi.fn()

  beforeEach(() => {
    navigate.mockReset()
    windowOpen.mockReset()
    global.window.open = windowOpen
  })

  const run = (event: Record<string, unknown>, url = URL) => {
    const preventDefault = vi.fn()
    const handler = createNavigationHandler(url, navigate as unknown as UseNavigateResult<string>)
    handler({
      metaKey: false,
      ctrlKey: false,
      preventDefault,
      ...event,
    } as unknown as NavigationEvent)
    return { preventDefault }
  }

  const expectOutcome = (outcome: Outcome) => {
    if (outcome === 'push') {
      expect(navigate).toHaveBeenCalledWith({ to: URL, search: {}, hash: '' })
    } else {
      expect(navigate).not.toHaveBeenCalled()
    }
    if (outcome === 'new-tab') {
      expect(windowOpen).toHaveBeenCalledWith(URL, '_blank')
    } else {
      expect(windowOpen).not.toHaveBeenCalled()
    }
  }

  it.each<[string, Record<string, unknown>, Outcome]>([
    ['Enter', { key: 'Enter' }, 'push'],
    ['Space', { key: ' ' }, 'push'],
    ['Cmd + Enter', { key: 'Enter', metaKey: true }, 'new-tab'],
    ['Ctrl + Enter', { key: 'Enter', ctrlKey: true }, 'new-tab'],
    ['Cmd + Space', { key: ' ', metaKey: true }, 'new-tab'],
  ])('handles %s by preventing default and navigating', (_, event, outcome) => {
    const { preventDefault } = run(event)

    expect(preventDefault).toHaveBeenCalled()
    expectOutcome(outcome)
  })

  it('ignores other keys', () => {
    const { preventDefault } = run({ key: 'a' })

    expect(preventDefault).not.toHaveBeenCalled()
    expectOutcome('none')
  })

  it.each<[string, Record<string, unknown>, Outcome]>([
    ['a regular left click', { button: 0 }, 'push'],
    ['a middle click', { button: 1 }, 'new-tab'],
    ['Cmd + left click', { button: 0, metaKey: true }, 'new-tab'],
    ['Ctrl + left click', { button: 0, ctrlKey: true }, 'new-tab'],
    // Right click opens the context menu, so it must not navigate.
    ['a right click', { button: 2 }, 'none'],
  ])('handles %s', (_, event, outcome) => {
    const { preventDefault } = run(event)

    expectOutcome(outcome)
    // New-tab clicks must not also trigger the browser's default navigation
    if (outcome === 'new-tab') expect(preventDefault).toHaveBeenCalled()
  })

  it('splits path, search params, and hash when navigating', () => {
    run({ button: 0 }, '/project/123/settings?tab=general&filter=a&filter=b#limits')

    expect(navigate).toHaveBeenCalledWith({
      to: '/project/123/settings',
      search: { tab: 'general', filter: ['a', 'b'] },
      hash: 'limits',
    })
  })
})

describe('navigateToUrl', () => {
  it('splits internal paths into to, search, and hash and preserves newlines in query values', () => {
    const navigate = vi.fn()
    navigateToUrl(
      navigate as unknown as UseNavigateResult<string>,
      '/project/123/logs/explorer?s=select%0A1&tag=a&tag=b#results',
      { replace: true }
    )

    expect(navigate).toHaveBeenCalledWith({
      to: '/project/123/logs/explorer',
      search: { s: 'select\n1', tag: ['a', 'b'] },
      hash: 'results',
      replace: true,
    })
  })

  it('uses reloadDocument for cross-origin and protocol-relative URLs', () => {
    const navigate = vi.fn()
    navigateToUrl(navigate as unknown as UseNavigateResult<string>, 'https://supabase.com/docs')
    expect(navigate).toHaveBeenCalledWith({
      href: 'https://supabase.com/docs',
      reloadDocument: true,
    })

    navigateToUrl(navigate as unknown as UseNavigateResult<string>, '//example.com/docs', {
      replace: true,
    })
    expect(navigate).toHaveBeenLastCalledWith({
      href: `${window.location.protocol}//example.com/docs`,
      reloadDocument: true,
      replace: true,
    })
  })
})
