import { createBrowserHistory } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  armPanelPush,
  dismissPanelUrl,
  isPanelHistoryTraversalTo,
  registerPanelBackGuard,
  replacePanelUrl,
  resetPanelHistoryForTests,
} from './panel-history'
import {
  consumeUserActivation,
  emitUserNavigate,
  installNavigationDouble,
  uninstallNavigationDouble,
  userTraverse,
} from '@/tests/lib/panel-navigation-double'

const PANEL_URL = '/project/default/database/functions?new=true'

function spyOnNavigationBack() {
  const navigation = Reflect.get(window, 'navigation') as { back: () => unknown }
  return vi.spyOn(navigation, 'back')
}

describe('panel history', () => {
  beforeEach(() => {
    resetPanelHistoryForTests()
    installNavigationDouble()
    window.history.replaceState(null, '', '/project/default/database/functions')
  })

  afterEach(() => {
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
    vi.useRealTimers()
  })

  it('goes back when the armed push is still the current entry', () => {
    const replace = vi.fn()
    const back = spyOnNavigationBack()

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    dismissPanelUrl('new', replace)

    expect(back).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')
  })

  it('replaces when the navigation api is missing, even after a push', () => {
    uninstallNavigationDouble()
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back')

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    dismissPanelUrl('new', replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
    installNavigationDouble()
  })

  it('replaces when the navigation api never saw an owned push', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back')

    dismissPanelUrl('new', replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
  })

  it('replaces when another panel key pushed over the owned entry', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back')

    armPanelPush('edit')
    window.history.pushState(null, '', '/project/default/database/functions?edit=1')
    armPanelPush('show')
    window.history.pushState(null, '', '/project/default/auth/users?show=1')
    dismissPanelUrl('edit', replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
  })

  it('replaces a same-entry navigation to another route', () => {
    const replace = vi.fn()
    const back = vi.spyOn(window.history, 'back')

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    window.history.replaceState(null, '', '/project/default/auth/users?new=true')
    dismissPanelUrl('new', replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
  })

  it('replaces when search outside the panel param changed while it was open', () => {
    const replace = vi.fn(() => {
      window.history.replaceState(null, '', '/project/default/auth/users?q=ada')
    })
    const back = vi.spyOn(window.history, 'back')

    armPanelPush('show')
    window.history.pushState(null, '', '/project/default/auth/users?show=1')
    window.history.replaceState(null, '', '/project/default/auth/users?show=1&q=ada')
    dismissPanelUrl('show', replace)

    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('?q=ada')
  })

  it('goes back for each nested panel that still owns its entry', () => {
    const replace = vi.fn()
    const back = spyOnNavigationBack()

    armPanelPush('a')
    window.history.pushState(null, '', '/project/default/database/functions?a=1')
    armPanelPush('b')
    window.history.pushState(null, '', '/project/default/database/functions?a=1&b=1')

    dismissPanelUrl('b', replace)
    expect(window.location.search).toBe('?a=1')
    dismissPanelUrl('a', replace)

    expect(back).toHaveBeenCalledTimes(2)
    expect(replace).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')
  })

  it('keeps the other panel owned when one key is replace-cleared', () => {
    const replace = vi.fn()
    const back = spyOnNavigationBack()

    armPanelPush('a')
    window.history.pushState(null, '', '/project/default/database/functions?a=1')
    armPanelPush('b')
    window.history.pushState(null, '', '/project/default/database/functions?a=1&b=1')
    replacePanelUrl('b', () => {
      window.history.replaceState(null, '', '/project/default/database/functions?a=1')
    })

    window.history.back()
    dismissPanelUrl('a', replace)

    expect(replace).not.toHaveBeenCalled()
    expect(back).toHaveBeenCalledOnce()
  })

  it('still goes back after Forward returns to the owned entry', () => {
    const replace = vi.fn()
    const back = spyOnNavigationBack()

    armPanelPush('edit')
    window.history.pushState(null, '', '/project/default/database/functions?edit=1')
    window.history.back()
    window.history.forward()
    dismissPanelUrl('edit', replace)

    expect(replace).not.toHaveBeenCalled()
    expect(back).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('')
  })

  it('does not patch pushState, so history destroy cannot strand a wrapper', () => {
    const before = window.history.pushState
    const history = createBrowserHistory()

    expect(window.history.pushState).not.toBe(before)
    history.destroy()

    expect(window.history.pushState).toBe(before)
    armPanelPush('edit')
    expect(window.history.pushState).toBe(before)
  })

  it('cancels a user back while the panel is dirty and leaves the url alone', () => {
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    userTraverse(-1)

    expect(onBlock).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('?new=true')
    unsubscribe()
  })

  it('asks again when Back is pressed after the confirm is dismissed', () => {
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    userTraverse(-1)
    userTraverse(-1)

    expect(onBlock).toHaveBeenCalledTimes(2)
    expect(window.location.search).toBe('?new=true')
    unsubscribe()
  })

  it('cancels Forward on a dirty panel', () => {
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    window.history.pushState(null, '', '/project/default/database/functions?other=1')
    window.history.back()
    userTraverse(1)

    expect(onBlock).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('?new=true')
    unsubscribe()
  })

  it('ignores a hash-only traverse and a scripted back', () => {
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    emitUserNavigate(`${window.location.href}#setup`)
    window.history.back()

    expect(onBlock).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')
    unsubscribe()
  })

  it('restores the panel url when Back already consumed the user activation', () => {
    vi.useFakeTimers()
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    const panelHref = window.location.href
    consumeUserActivation()
    userTraverse(-1)
    expect(onBlock).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')

    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined)
    vi.advanceTimersByTime(0)
    expect(go).toHaveBeenCalledWith(1)
    expect(onBlock).not.toHaveBeenCalled()

    window.history.replaceState(null, '', panelHref)
    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(onBlock).toHaveBeenCalledOnce()
    expect(window.location.href).toBe(panelHref)
    unsubscribe()
  })

  it('still confirms a different destination while a panel close is pending', () => {
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    const navigation = Reflect.get(window, 'navigation') as { back?: () => unknown }
    const back = navigation.back
    navigation.back = () => ({ finished: Promise.resolve() })
    dismissPanelUrl('new', vi.fn())
    navigation.back = back
    emitUserNavigate('http://localhost/project/default/auth/users')

    expect(onBlock).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('?new=true')
    unsubscribe()
  })

  it('swallows an aborted navigation.back committed and finished promise', async () => {
    const committed = Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))
    const finished = Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))
    const navigation = Reflect.get(window, 'navigation') as { back?: () => unknown }
    navigation.back = () => ({ committed, finished })

    armPanelPush('new')
    const previousHref = window.location.href
    window.history.pushState(null, '', PANEL_URL)
    dismissPanelUrl('new', vi.fn())
    expect(isPanelHistoryTraversalTo(previousHref)).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(isPanelHistoryTraversalTo(previousHref)).toBe(false)
  })

  it('expires each armed key on its own timer', () => {
    vi.useFakeTimers()
    const replace = vi.fn()
    const back = spyOnNavigationBack()

    armPanelPush('edit')
    vi.advanceTimersByTime(400)
    armPanelPush('show')
    vi.advanceTimersByTime(100)
    window.history.pushState(null, '', '/project/default/database/functions?show=1')
    dismissPanelUrl('show', replace)

    expect(back).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled()
  })

  it('redispatches the swallowed popstate when a restore never lands', () => {
    vi.useFakeTimers()
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })
    const popped: string[] = []
    const onPopState = () => {
      popped.push(window.location.href)
    }
    window.addEventListener('popstate', onPopState)

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    const panelHref = window.location.href
    consumeUserActivation()
    userTraverse(-1)
    vi.spyOn(window.history, 'go').mockImplementation(() => undefined)
    vi.advanceTimersByTime(0)

    expect(popped).toEqual([])
    expect(window.location.href).not.toBe(panelHref)

    vi.advanceTimersByTime(1000)

    expect(popped).toEqual([window.location.href])
    expect(onBlock).not.toHaveBeenCalled()
    window.removeEventListener('popstate', onPopState)
    unsubscribe()
  })

  it('stops swallowing popstate when a restore never arrives', () => {
    vi.useFakeTimers()
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    consumeUserActivation()
    userTraverse(-1)
    vi.spyOn(window.history, 'go').mockImplementation(() => undefined)
    vi.advanceTimersByTime(0)
    vi.advanceTimersByTime(1000)

    const event = new PopStateEvent('popstate', { cancelable: true })
    const stop = vi.spyOn(event, 'stopImmediatePropagation')
    window.dispatchEvent(event)

    expect(stop).not.toHaveBeenCalled()
    expect(onBlock).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('does not confirm when the restore delta cannot be applied', () => {
    vi.useFakeTimers()
    const onBlock = vi.fn()
    const unsubscribe = registerPanelBackGuard({
      shouldBlock: () => true,
      onBlock,
    })

    armPanelPush('new')
    window.history.pushState(null, '', PANEL_URL)
    consumeUserActivation()
    userTraverse(-1)
    vi.spyOn(window.history, 'go').mockImplementation(() => undefined)
    vi.advanceTimersByTime(0)

    expect(onBlock).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')
    unsubscribe()
  })
})
