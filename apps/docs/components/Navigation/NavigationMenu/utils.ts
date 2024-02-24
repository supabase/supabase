import { createContext, useContext, useEffect, useRef } from 'react'

import { useConstant } from 'common'

import { DocsEvent, fireCustomEvent } from '~/lib/events'
import { elementInViewport, prefersReducedMotion } from '~/lib/uiUtils'
import { type RefMenuItem } from './NavigationMenuRefListItems'

// https://www.totaltypescript.com/get-keys-of-an-object-where-values-are-of-a-given-type
type KeysOfValue<T extends object, TCondition> = {
  [K in keyof T]: T[K] extends TCondition ? K : never
}[keyof T]

type RecKeys<Obj extends object> = KeysOfValue<Obj, Array<Obj>>

const recPush =
  <I extends object, K extends RecKeys<I>, O>(mapFn: (input: I) => O, recKey: K) =>
  (res: Array<O>, curr: I) => {
    res.push(mapFn(curr))
    if (recKey in curr) res.push(...recPush(mapFn, recKey)(res, curr))
    return res
  }

/**
 * Imperative DOM logic to control aria-current and submenu collapsibility.
 * Doing this imperatively allows us to memoize almost the entire nav menu,
 * and means we can eventually make the bulk of it a Layout Server Component.
 */
const createActiveElemController = () => {
  const EVT = DocsEvent.SIDEBAR_NAV_CHANGE
  const DATA_COLLAPSIBLE_TRIGGER = 'data-contains'
  const COLLAPSIBLE_GROUP = 'ref-nav-menu-collapsible'
  const BOUNDARY_MARKER = '#'

  let expandedTriggers: Array<HTMLElement> = []
  let ariaCurrent: HTMLElement
  let afHandle: ReturnType<typeof requestAnimationFrame>

  const getAriaControlledSibling = (start: HTMLElement) => {
    const id = start.dataset.controls
    if (!id) return null

    let curr: Element = start.parentElement
    while (curr['id'] !== id && curr.nextElementSibling) {
      curr = curr.nextElementSibling
    }
    return curr['id'] === id && curr instanceof HTMLElement ? curr : null
  }

  const getSharedCollapsibleParentProps = () => ({
    ['data-group']: COLLAPSIBLE_GROUP,
  })

  const getInitialCollapsibleTriggerProps = (self: RefMenuItem, children: Array<RefMenuItem>) => ({
    id: self.id,
    [DATA_COLLAPSIBLE_TRIGGER]: children
      .reduce(
        recPush((child) => `${BOUNDARY_MARKER}${child.href}${BOUNDARY_MARKER}`, 'items'),
        [`${BOUNDARY_MARKER}${self.href}${BOUNDARY_MARKER}`]
      )
      .join(),
    'aria-expanded': false,
    'aria-controls': `${self.id}-subitems`,
    // [Charis] for some reason couldn't read aria-controls from JS
    'data-controls': `${self.id}-subitems`,
  })

  const getInitialCollapsedProps = (parent: RefMenuItem) => ({
    id: `${parent.id}-subitems`,
    hidden: true,
    ['aria-controlledby']: parent.id,
  })

  const syncCollapsibleTriggers = (container: HTMLElement) => {
    // Need to fix this, this is hacky
    const pathname = window.location.pathname.replace('/docs/reference', '')
    const triggers = [
      ...container.querySelectorAll(
        `[${DATA_COLLAPSIBLE_TRIGGER}*="${BOUNDARY_MARKER}${pathname}${BOUNDARY_MARKER}"]`
      ),
    ] as unknown as Array<HTMLElement>
    triggers.forEach((trigger) => {
      trigger.ariaExpanded = 'true'
      const controlled = getAriaControlledSibling(trigger)
      if (controlled) controlled.hidden = false
    })
    expandedTriggers.forEach((oldTrigger) => {
      if (!triggers.includes(oldTrigger)) {
        oldTrigger.ariaExpanded = 'false'
        const controlled = getAriaControlledSibling(oldTrigger)
        if (controlled) controlled.hidden = true
      }
    })
    expandedTriggers = triggers
  }

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

  const firePageChange = (elem: HTMLElement) => {
    fireCustomEvent(elem, EVT, { bubbles: true })
  }

  const syncAll = (container: HTMLElement) => {
    syncCollapsibleTriggers(container)
    syncAriaCurrent(container)
  }

  const subscribeSyncs = (container: HTMLElement) => {
    const syncAllBound = () => syncAll(container)
    container.addEventListener(EVT, syncAllBound)
    return () => container.removeEventListener(EVT, syncAllBound)
  }

  return {
    getInitialCollapsibleTriggerProps,
    getInitialCollapsedProps,
    getSharedCollapsibleParentProps,
    firePageChange,
    syncAll,
    subscribeSyncs,
  }
}

const ActiveElemContext = createContext<
  Omit<ReturnType<typeof createActiveElemController>, 'subscribeSyncs'> | undefined
>(undefined)

const useActiveElemController = () => {
  const { subscribeSyncs, ...activeElemController } = useConstant(createActiveElemController)
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
  const { getInitialCollapsibleTriggerProps, getInitialCollapsedProps } = useActiveElemContext()
  return { getInitialCollapsibleTriggerProps, getInitialCollapsedProps }
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
