// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createNavigationHandler } from './navigation'

type NavigationEvent = Parameters<ReturnType<typeof createNavigationHandler>>[0]
type Outcome = 'push' | 'new-tab' | 'none'

describe('createNavigationHandler', () => {
  const URL = '/project/123/settings'
  const router = { push: vi.fn() }
  const windowOpen = vi.fn()

  beforeEach(() => {
    router.push.mockReset()
    windowOpen.mockReset()
    global.window.open = windowOpen
  })

  const run = (event: Record<string, unknown>) => {
    const preventDefault = vi.fn()
    const handler = createNavigationHandler(
      URL,
      router as unknown as Parameters<typeof createNavigationHandler>[1]
    )
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
      expect(router.push).toHaveBeenCalledWith(URL)
    } else {
      expect(router.push).not.toHaveBeenCalled()
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
})
