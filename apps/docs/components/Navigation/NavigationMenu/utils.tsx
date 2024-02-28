import {
  type MouseEventHandler,
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react'

import { useConstant } from 'common'

import { DocsEvent, fireCustomEvent } from '~/lib/events'
import { elementInViewport, prefersReducedMotion } from '~/lib/uiUtils'
import { type RefMenuItemWithChildren } from './NavigationMenuRefListItems'

// https://www.totaltypescript.com/get-keys-of-an-object-where-values-are-of-a-given-type
type KeysOfValue<T extends object, TCondition> = {
  [K in keyof T]: T[K] extends TCondition ? K : never
}[keyof T]

type RecKeys<Obj extends object> = KeysOfValue<Obj, Array<Obj>>

const recPush =
  <I extends object, K extends RecKeys<I>, O>(mapFn: (input: I) => O, recKey: K) =>
  (res: Array<O>, curr: I) => {
    res.push(mapFn(curr))
    // @ts-ignore - keeps complaining reduce doesn't exist on I[K] though it's defined as an array
    if (recKey in curr) res.push(...curr[recKey].reduce(recPush(mapFn, recKey), res))
    return res
  }

const createAriaCurrentController = () => {
  let _ariaCurrent: HTMLElement
  let _afHandle: ReturnType<typeof requestAnimationFrame>
  let _container: HTMLElement

  const handleNavigation = () => {
    const pathname = window.location.pathname
    const curr = _container?.querySelector(`a[href="${pathname}"]`) as HTMLElement
    if (curr) {
      if (_ariaCurrent) _ariaCurrent.ariaCurrent = undefined
      curr.ariaCurrent = 'page'
      _ariaCurrent = curr

      if (_afHandle) cancelAnimationFrame(_afHandle)
      _afHandle = requestAnimationFrame(() => {
        if (!elementInViewport(_ariaCurrent)) {
          _ariaCurrent.scrollIntoView({
            behavior: prefersReducedMotion() ? 'smooth' : 'instant',
            block: 'center',
          })
        }
      })
    }
  }

  const setup = (container: HTMLElement, evt: DocsEvent) => {
    _container = container
    _container.addEventListener(evt, handleNavigation)
    return () => container.removeEventListener(evt, handleNavigation)
  }

  return {
    setup,
  }
}

/**
 * Imperative DOM logic to control aria-current and submenu collapsibility.
 * Doing this imperatively allows us to memoize almost the entire nav menu,
 * and means we can eventually make the bulk of it a Layout Server Component.
 */
const createCollapsibleController = () => {
  const CLICK_EVENT = DocsEvent.SIDEBAR_EXPAND_CLICK
  const DATA_MARKER = 'data-sidebar-nav-collapsible-group'
  const DATA_CONTAINS = 'data-contains'
  const BOUNDARY_MARKER = '#'

  let _container: HTMLElement
  let _expandedGroups = new Map<string, HTMLElement>()

  const fireToggle = (elem: EventTarget) => {
    fireCustomEvent(elem, CLICK_EVENT, {
      bubbles: true,
      detail: {
        id: (elem as HTMLElement).dataset.sidebarNavCollapsibleGroup?.replace('-trigger', ''),
        open: (elem as HTMLElement).ariaExpanded === 'true',
      },
    })
  }

  const getRootProps = (inner: RefMenuItemWithChildren) => ({
    [DATA_MARKER]: `${inner.id}`,
    [DATA_CONTAINS]: inner.items
      .reduce(
        recPush((child) => `${BOUNDARY_MARKER}${child.href}${BOUNDARY_MARKER}`, 'items'),
        [`${BOUNDARY_MARKER}${inner.href}${BOUNDARY_MARKER}`]
      )
      .join(),
  })

  const getTriggerProps = (self: RefMenuItemWithChildren) => ({
    [DATA_MARKER]: `${self.id}-trigger`,
    'aria-expanded': false,
    'aria-controls': `${self.id}-subitems`,
    onClick: ((e) => fireToggle(e.currentTarget)) as MouseEventHandler,
  })

  const getControlledProps = (parent: RefMenuItemWithChildren) => ({
    id: `${parent.id}-subitems`,
    [DATA_MARKER]: `${parent.id}-subitems`,
    hidden: true,
  })

  const getTrigger = (group: HTMLElement) =>
    group?.querySelector(`[${DATA_MARKER}$="trigger"]`) as HTMLButtonElement
  const getControlled = (group: HTMLElement) =>
    group?.querySelector(`[${DATA_MARKER}$="subitems"]`) as HTMLElement

  const setClosed = (id: string, group: HTMLElement) => {
    const trigger = getTrigger(group)
    const controlled = getControlled(group)
    if (!(trigger && controlled)) return

    // [Charis] Updates don't work synchronously, not sure why
    setTimeout(() => {
      trigger.ariaExpanded = 'false'
      trigger.disabled = false
      controlled.hidden = true

      _expandedGroups.delete(id)
    }, 0)
  }

  const setOpen = (id: string, group: HTMLElement, { disable }: { disable?: boolean } = {}) => {
    const trigger = getTrigger(group)
    const controlled = getControlled(group)
    if (!(trigger && controlled)) return

    // [Charis] Updates don't work synchronously, not sure why
    setTimeout(() => {
      trigger.ariaExpanded = 'true'
      if (disable) trigger.disabled = true
      controlled.hidden = false

      _expandedGroups.set(id, group)
    }, 0)
  }

  // Unify typing for this
  const handleToggle = (e: CustomEvent<{ id: string | undefined; open: boolean }>) => {
    if (!e.detail.id) return

    const group = _container.querySelector(`[${DATA_MARKER}="${e.detail.id}"]`) as HTMLElement
    return group
      ? e.detail.open
        ? setClosed(e.detail.id, group)
        : setOpen(e.detail.id, group)
      : undefined
  }

  const handleNavigation = () => {
    // Need to fix this, this is hacky
    const pathname = window.location.pathname.replace('/docs/reference', '')
    const newExpanded = []
    ;(
      [
        ..._container.querySelectorAll(
          `[${DATA_MARKER}][${DATA_CONTAINS}*="${BOUNDARY_MARKER}${pathname}${BOUNDARY_MARKER}"]`
        ),
      ] as Array<HTMLElement>
    ).forEach((group) => {
      const id = group.getAttribute(DATA_MARKER)
      setOpen(id, group, { disable: true })
      newExpanded.push(id)
    })
    for (const id of _expandedGroups.keys()) {
      if (newExpanded.includes(id)) return

      const group = _expandedGroups.get(id)
      if (!group) return

      setClosed(id, group)
    }
  }

  const setup = (container: HTMLElement, navEvt: DocsEvent) => {
    _container = container
    _container.addEventListener(navEvt, handleNavigation)
    _container.addEventListener(CLICK_EVENT, handleToggle)

    return () => {
      _container.removeEventListener(navEvt, handleNavigation)
      _container.addEventListener(CLICK_EVENT, handleToggle)
    }
  }

  return {
    propGetters: {
      getRootProps,
      getTriggerProps,
      getControlledProps,
    },
    setup,
  }
}

const createNavController = () => {
  const NAV_EVT = DocsEvent.SIDEBAR_NAV_CHANGE

  const firePageChange = (elem: EventTarget) => {
    fireCustomEvent(elem, NAV_EVT, { bubbles: true })
  }

  const ariaCurrentController = createAriaCurrentController()
  const collapsibleController = createCollapsibleController()

  const setup = (container: HTMLElement) => {
    const tearDown = ariaCurrentController.setup(container, NAV_EVT)
    const tearDown_ = collapsibleController.setup(container, NAV_EVT)

    // Immediately fire a page change to set up initial state
    firePageChange(container)

    return () => (tearDown(), tearDown_())
  }

  return {
    propGetters: collapsibleController.propGetters,
    firePageChange,
    setup,
  }
}

const ActivePageContext = createContext<ReturnType<typeof createNavController> | undefined>(
  undefined
)

const useActivePageController = () => {
  const navController = useConstant(createNavController)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => navController.setup(ref.current), [navController])

  return { ref, value: navController }
}

const useActivePageContext = () => {
  const context = useContext(ActivePageContext)
  if (!context) throw Error('`useFirePageChange` must be used within an `ActiveElemContext`')
  return context
}

const useGetInitialCollapsibleProps = () => {
  const { propGetters } = useActivePageContext()
  return {
    ...propGetters,
  }
}

const useFirePageChange = () => {
  const { firePageChange } = useActivePageContext()
  return firePageChange
}

const ActivePageProvider = ({ children, className }: PropsWithChildren<{ className: string }>) => {
  const { ref, value } = useActivePageController()

  return (
    <ActivePageContext.Provider value={value}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </ActivePageContext.Provider>
  )
}

export {
  ActivePageProvider,
  useActivePageController,
  useFirePageChange,
  useGetInitialCollapsibleProps,
}
