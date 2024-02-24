import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

import { DocsEvent, fireCustomEvent } from '~/lib/events'
import NavigationMenuRefListItems, {
  type RefMenuItem,
  type RefMenuCategory,
} from './NavigationMenuRefListItems'

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
 * which makes a difference because ref nav menus can get long and janky.
 */
const createActiveElemController = () => {
  const EVT = DocsEvent.SIDEBAR_NAV_CHANGE
  const DATA_COLLAPSIBLE_TRIGGER = 'data-contains'
  const BOUNDARY_MARKER = '#'

  let expandedTriggers: Array<Element> = []
  let ariaCurrent: Element

  const getAriaControlledSibling = (start: Element) => {
    const id = start['aria-controls']
    if (!id) return null

    let curr = start
    while (curr['id'] !== id && curr.nextElementSibling) {
      curr = curr.nextElementSibling
    }
    return curr['id'] === id && curr instanceof HTMLElement ? curr : null
  }

  const getInitialCollapsibleTriggerProps = (children: Array<RefMenuItem>) => ({
    [DATA_COLLAPSIBLE_TRIGGER]: children
      .reduce(
        recPush((child) => `${BOUNDARY_MARKER}${child.id}${BOUNDARY_MARKER}`, 'items'),
        [] as Array<string>
      )
      .join(),
    ['aria-expanded']: false,
  })

  const syncCollapsibleTriggers = (container: HTMLElement) => {
    const pathname = window.location.pathname
    const triggers = [
      ...container.querySelectorAll(
        `[${DATA_COLLAPSIBLE_TRIGGER}*="${BOUNDARY_MARKER}${pathname}${BOUNDARY_MARKER}"]`
      ),
    ]
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
    const curr = container.querySelector(`a[href="${pathname}"]`)
    if (curr) {
      if (ariaCurrent) ariaCurrent.ariaCurrent = undefined
      curr.ariaCurrent = 'page'
      ariaCurrent = curr
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
    document.addEventListener(EVT, syncAllBound)
    return () => document.removeEventListener(EVT, syncAllBound)
  }

  return {
    getInitialCollapsibleTriggerProps,
    firePageChange,
    syncAll,
    subscribeSyncs,
  }
}

const ActiveElemContext = createContext<
  { firePageChange: ReturnType<typeof createActiveElemController>['firePageChange'] } | undefined
>(undefined)

const useActiveElemController = () => {
  const [activeElemController] = useState(createActiveElemController)
  const contextValueRef = useRef({ firePageChange: activeElemController.firePageChange })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(
    () => (
      activeElemController.syncAll(ref.current), activeElemController.subscribeSyncs(ref.current)
    ),
    [activeElemController]
  )

  return { ref, contextValueRef }
}

const useFirePageChange = () => {
  const context = useContext(ActiveElemContext)
  if (!context) throw Error('`useFirePageChange` must be used within an `ActiveElemContext`')
  return context.firePageChange
}

interface NavigationMenuRefListProps {
  id: string
  menuData: Array<RefMenuCategory>
}

const NavigationMenuRefList = ({ id, menuData }: NavigationMenuRefListProps) => {
  const { ref, contextValueRef } = useActiveElemController()

  return (
    <ActiveElemContext.Provider value={contextValueRef.current}>
      <div
        ref={ref}
        className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150 h-auto"
      >
        <NavigationMenuRefListItems id={id} menuData={menuData} />
      </div>
    </ActiveElemContext.Provider>
  )
}

export default NavigationMenuRefList
