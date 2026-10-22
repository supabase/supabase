import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  armPanelPush,
  commitPanelUrl,
  dismissPanelUrl,
  registerPanelBackGuard,
  resetPanelHistoryForTests,
} from './panel-history'

describe('panel history', () => {
  beforeEach(() => {
    resetPanelHistoryForTests()
    window.history.replaceState(null, '', '/project/default/database/functions')
  })

  afterEach(() => {
    resetPanelHistoryForTests()
    vi.useRealTimers()
  })

  it('goes back when this session pushed the current entry', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)

    armPanelPush()
    window.history.pushState(null, '', '/project/default/database/functions?new=true')
    dismissPanelUrl(replace)

    expect(back).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled()
  })

  it('replaces when the entry was not opened here', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)

    dismissPanelUrl(replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
  })

  it('replaces a save even when the open entry is owned', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)

    armPanelPush()
    window.history.pushState(null, '', '/project/default/database/functions?new=true')
    commitPanelUrl(replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()

    dismissPanelUrl(replace)
    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledTimes(2)
  })

  it('drops ownership after Back so a restored panel replaces on close', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)

    armPanelPush()
    window.history.pushState(null, '', '/project/default/database/functions?edit=1')
    window.dispatchEvent(new PopStateEvent('popstate'))
    dismissPanelUrl(replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
  })

  it('puts the entry back and confirms when Back would drop a dirty panel', () => {
    vi.useFakeTimers()
    const onBlock = vi.fn()
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(onBlock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(0)

    expect(go).toHaveBeenCalledWith(1)
    expect(onBlock).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(50)
    expect(onBlock).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('still confirms when restoring the panel entry does not pop', () => {
    vi.useFakeTimers()
    const onBlock = vi.fn()
    vi.spyOn(window.history, 'go').mockImplementation(() => undefined)
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    window.dispatchEvent(new PopStateEvent('popstate'))
    vi.advanceTimersByTime(0)
    expect(onBlock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    expect(onBlock).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('cancels a traverse back while the panel is still dirty', () => {
    const navigation = new EventTarget()
    Object.defineProperty(window, 'navigation', {
      configurable: true,
      value: navigation,
    })

    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })
    const event = new Event('navigate', { cancelable: true })
    Object.defineProperty(event, 'navigationType', { value: 'traverse' })

    const prevented = !navigation.dispatchEvent(event)

    expect(prevented).toBe(true)
    expect(onBlock).toHaveBeenCalledOnce()
    unsubscribe()
    Reflect.deleteProperty(window, 'navigation')
  })

  it('lets the back from closing an owned panel leave', () => {
    const navigation = new EventTarget()
    Object.defineProperty(window, 'navigation', {
      configurable: true,
      value: navigation,
    })

    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)

    armPanelPush()
    window.history.pushState(null, '', '/project/default/database/functions?new=true')
    dismissPanelUrl(vi.fn())

    const event = new Event('navigate', { cancelable: true })
    Object.defineProperty(event, 'navigationType', { value: 'traverse' })
    const prevented = !navigation.dispatchEvent(event)

    expect(back).toHaveBeenCalledOnce()
    expect(prevented).toBe(false)
    expect(onBlock).not.toHaveBeenCalled()
    unsubscribe()
    Reflect.deleteProperty(window, 'navigation')
  })
})
