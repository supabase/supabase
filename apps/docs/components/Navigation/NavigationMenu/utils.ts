import { type MouseEventHandler, createContext, useContext, useEffect, useRef } from 'react'

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

type TriggerGroups = {
  trigger: HTMLButtonElement | null
  controlled: HTMLElement | null
}

const createAriaCurrentController = () => {
  let ariaCurrent: HTMLElement
  let afHandle: ReturnType<typeof requestAnimationFrame>

  const syncAriaCurrent = (container: HTMLElement) => {
    const pathname = window.location.pathname
    const curr = container.querySelector(`a[href="${pathname}"]`) as HTMLElement
    if (curr) {
      if (ariaCurrent) ariaCurrent.ariaCurrent = undefined
      curr.ariaCurrent = 'page'
      ariaCurrent = curr

      if (afHandle) cancelAnimationFrame(afHandle)
      afHandle = requestAnimationFrame(() => {
        if (!elementInViewport(ariaCurrent)) {
          ariaCurrent.scrollIntoView({
            behavior: prefersReducedMotion() ? 'instant' : 'smooth',
            block: 'center',
          })
        }
      })
    }
  }

  return {
    syncAriaCurrent,
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

  let expandedGroups: Array<TriggerGroups> = []

  const fireCollapsibleToggle = (elem: EventTarget) => {
    fireCustomEvent(elem, CLICK_EVENT, {
      bubbles: true,
      detail: {
        id: (elem as HTMLElement).dataset.sidebarNavCollapsibleGroup?.replace('-trigger', ''),
        open: (elem as HTMLElement).ariaExpanded === 'true',
      },
    })
  }

  const getSharedCollapsibleParentProps = (inner: RefMenuItemWithChildren) => ({
    [DATA_MARKER]: `${inner.id}`,
    [DATA_CONTAINS]: inner.items
      .reduce(
        recPush((child) => `${BOUNDARY_MARKER}${child.href}${BOUNDARY_MARKER}`, 'items'),
        [`${BOUNDARY_MARKER}${inner.href}${BOUNDARY_MARKER}`]
      )
      .join(),
  })

  const getInitialCollapsibleTriggerProps = (self: RefMenuItemWithChildren) => ({
    id: self.id,
    [DATA_MARKER]: `${self.id}-trigger`,
    'aria-expanded': false,
    'aria-controls': `${self.id}-subitems`,
    onClick: ((e) => fireCollapsibleToggle(e.currentTarget)) as MouseEventHandler,
  })

  const getInitialCollapsedProps = (parent: RefMenuItemWithChildren) => ({
    id: `${parent.id}-subitems`,
    [DATA_MARKER]: `${parent.id}-subitems`,
    hidden: true,
    'aria-controlledby': parent.id,
  })

  const syncCollapsibleTriggers = (container: HTMLElement) => {
    // Need to fix this, this is hacky
    const pathname = window.location.pathname.replace('/docs/reference', '')
    const groups = [
      ...container.querySelectorAll(
        `[${DATA_MARKER}][${DATA_CONTAINS}*="${BOUNDARY_MARKER}${pathname}${BOUNDARY_MARKER}"]`
      ),
    ].map((group) => ({
      trigger: group.querySelector(`[${DATA_MARKER}$="trigger"]`),
      controlled: group.querySelector(`[${DATA_MARKER}$="subitems"]`),
    })) as Array<TriggerGroups>
    console.log(groups)
    groups.forEach(({ trigger, controlled }) => {
      if (trigger && controlled) {
        trigger.ariaExpanded = 'true'
        trigger.disabled = true
        controlled.hidden = false
      }
    })
    expandedGroups.forEach(({ trigger, controlled }) => {
      if (
        trigger &&
        controlled &&
        !groups.some((newGroup) => newGroup.controlled && newGroup.trigger === trigger)
      ) {
        trigger.ariaExpanded = 'false'
        trigger.disabled = false
        controlled.hidden = true
      }
    })
    expandedGroups = groups
  }

  const syncCollapsibleManual = (evt: CustomEvent) => {
    console.log(evt.detail)
  }

  return {
    getInitialCollapsibleTriggerProps,
    getInitialCollapsedProps,
    getSharedCollapsibleParentProps,
    syncCollapsibleTriggers,
    syncCollapsibleManual,
  }
}

const createNavController = () => {
  const NAV_EVT = DocsEvent.SIDEBAR_NAV_CHANGE
  const CLICK_EVENT = DocsEvent.SIDEBAR_EXPAND_CLICK

  const firePageChange = (elem: EventTarget) => {
    fireCustomEvent(elem, NAV_EVT, { bubbles: true })
  }

  const ariaCurrentController = createAriaCurrentController()
  const collapsibleController = createCollapsibleController()

  const syncAll = (container: HTMLElement) => {
    collapsibleController.syncCollapsibleTriggers(container)
    ariaCurrentController.syncAriaCurrent(container)
  }

  const subscribeSyncs = (container: HTMLElement) => {
    const syncAllBound = () => syncAll(container)
    container.addEventListener(NAV_EVT, syncAllBound)
    container.addEventListener(CLICK_EVENT, collapsibleController.syncCollapsibleManual)

    return () => {
      container.removeEventListener(NAV_EVT, syncAllBound)
      container.removeEventListener(CLICK_EVENT, collapsibleController.syncCollapsibleManual)
    }
  }

  return {
    syncAll,
    subscribeSyncs,
    getInitialCollapsibleTriggerProps: collapsibleController.getInitialCollapsibleTriggerProps,
    getInitialCollapsedProps: collapsibleController.getInitialCollapsedProps,
    getSharedCollapsibleParentProps: collapsibleController.getSharedCollapsibleParentProps,
    firePageChange,
    syncCollapsibleTriggers: collapsibleController.syncCollapsibleTriggers,
    syncCollapsibleManual: collapsibleController.syncCollapsibleManual,
  }
}

const ActiveElemContext = createContext<
  Omit<ReturnType<typeof createNavController>, 'subscribeSyncs'> | undefined
>(undefined)

const useActiveElemController = () => {
  const { subscribeSyncs, ...activeElemController } = useConstant(createNavController)
  const contextValueRef = useRef(activeElemController)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(
    () => (activeElemController.syncAll(ref.current), subscribeSyncs(ref.current)),
    [activeElemController, subscribeSyncs]
  )

  return { ref, contextValueRef }
}

const useActiveElemContext = () => {
  const context = useContext(ActiveElemContext)
  if (!context) throw Error('`useFirePageChange` must be used within an `ActiveElemContext`')
  return context
}

const useGetInitialCollapsibleProps = () => {
  const {
    getInitialCollapsibleTriggerProps,
    getInitialCollapsedProps,
    getSharedCollapsibleParentProps,
  } = useActiveElemContext()
  return {
    getInitialCollapsibleTriggerProps,
    getInitialCollapsedProps,
    getSharedCollapsibleParentProps,
  }
}

const useFirePageChange = () => {
  const { firePageChange } = useActiveElemContext()
  return firePageChange
}

export {
  ActiveElemContext,
  useActiveElemController,
  useFirePageChange,
  useGetInitialCollapsibleProps,
}
