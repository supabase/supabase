import * as TabsPrimitive from '@radix-ui/react-tabs'
import { useRouter } from 'next/router'
import {
  Children,
  type KeyboardEvent,
  type MouseEvent,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react'

import { TAB_CHANGE_EVENT_NAME } from '../../lib/events'
import styleHandler from '../../lib/theme/styleHandler'
import { useTabGroup } from './TabsProvider'

interface TabsProps {
  type?: 'pills' | 'underlined' | 'cards' | 'rounded-pills'
  defaultActiveId?: string
  activeId?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  queryGroup?: string
  block?: boolean
  tabBarGutter?: number
  tabBarStyle?: React.CSSProperties
  onChange?: any
  onClick?: any
  scrollable?: boolean
  wrappable?: boolean
  addOnBefore?: React.ReactNode
  addOnAfter?: React.ReactNode
  listClassNames?: string
  baseClassNames?: string
}

interface TabsSubComponents {
  Panel: React.FC<PropsWithChildren<PanelProps>>
}

const Tabs: React.FC<PropsWithChildren<TabsProps>> & TabsSubComponents = ({
  defaultActiveId,
  activeId,
  type = 'pills',
  size = 'tiny',
  queryGroup,
  block,
  onChange,
  onClick,
  scrollable,
  wrappable,
  addOnBefore,
  addOnAfter,
  listClassNames,
  baseClassNames,
  children: _children,
}) => {
  // toArray is used here to filter out invalid children
  // another method would be to use React.Children.map
  const children = Children.toArray(_children) as PanelPropsProps[]
  const tabIds = children.map((tab) => tab.props.id)

  const router = useRouter()
  const queryTabs = queryGroup ? router.query[queryGroup] : undefined
  const [queryTabRaw] = Array.isArray(queryTabs) ? queryTabs : [queryTabs]
  const queryTab = queryTabRaw && tabIds.includes(queryTabRaw) ? queryTabRaw : undefined

  const [activeTab, setActiveTab] = useState(
    queryTab ??
      defaultActiveId ??
      // if no defaultActiveId is set use the first panel
      children?.[0]?.props?.id
  )

  useEffect(() => {
    /**
     * [Charis] The query param change is done by manual manipulation of window
     * location and history, not by router.push (I think to avoid full-page
     * rerenders). This doesn't reliably trigger rerender of all tabs on the
     * page, possibly because it bypasses `useRouter`. The only way I could
     * find of avoiding the full-page rerender but still reacting reliably to
     * search param changes was to fire a CustomEvent.
     */

    function handleChange(e: CustomEvent) {
      if (
        e.detail.queryGroup &&
        e.detail.queryGroup === queryGroup &&
        tabIds.includes(e.detail.id)
      ) {
        setActiveTab(e.detail.id)
        setGroupActiveId?.(e.detail.id)
      }
    }

    window.addEventListener(TAB_CHANGE_EVENT_NAME, handleChange as EventListener)
    return () => window.removeEventListener(TAB_CHANGE_EVENT_NAME, handleChange as EventListener)
  }, [])

  // If query param present for the query group, switch to that tab.
  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab)
      setGroupActiveId?.(queryTab)
    }
  }, [queryTab])

  let __styles = styleHandler('tabs')

  const { groupActiveId, setGroupActiveId } = useTabGroup(tabIds)

  const active = activeId ?? groupActiveId ?? activeTab

  function onTabClick(currentTarget: EventTarget, id: string) {
    setActiveTab(id)
    setGroupActiveId?.(id)

    if (queryGroup) {
      const url = new URL(document.location.href)
      if (!url.searchParams.getAll('queryGroups')?.includes(queryGroup))
        url.searchParams.append('queryGroups', queryGroup)
      url.searchParams.set(queryGroup, id)
      window.history.replaceState(undefined, '', url)
    }

    currentTarget.dispatchEvent(
      new CustomEvent(TAB_CHANGE_EVENT_NAME, { bubbles: true, detail: { queryGroup, id } })
    )

    onClick?.(id)
    if (id !== active) {
      onChange?.(id)
    }
  }

  const listClasses = [__styles[type].list]
  if (scrollable) listClasses.push(__styles.scrollable)
  if (wrappable) listClasses.push(__styles.wrappable)
  if (listClassNames) listClasses.push(listClassNames)

  return (
    <TabsPrimitive.Root value={active} className={[__styles.base, baseClassNames].join(' ')}>
      <TabsPrimitive.List className={listClasses.join(' ')}>
        {addOnBefore}
        {children.map((tab) => {
          const isActive = active === tab.props.id
          const triggerClasses = [__styles[type].base, __styles.size[size]]
          if (isActive) {
            triggerClasses.push(__styles[type].active)
          } else {
            triggerClasses.push(__styles[type].inactive)
          }
          if (block) {
            triggerClasses.push(__styles.block)
          }

          return (
            <TabsPrimitive.Trigger
              onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.keyCode === 13) {
                  e.preventDefault()
                  onTabClick(e.currentTarget, tab.props.id)
                }
              }}
              onClick={(e: MouseEvent<HTMLButtonElement>) =>
                onTabClick(e.currentTarget, tab.props.id)
              }
              key={`${tab.props.id}-tab-button`}
              value={tab.props.id}
              className={triggerClasses.join(' ')}
            >
              {tab.props.icon}
              <span>{tab.props.label}</span>
              {tab.props.iconRight}
            </TabsPrimitive.Trigger>
          )
        })}
        {addOnAfter}
      </TabsPrimitive.List>
      {children as any}
    </TabsPrimitive.Root>
  )
}

// bit of a hack because we map over the JSX in the parent component
interface PanelPropsProps {
  props: PanelProps
}

interface PanelProps {
  id: string
  label?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  className?: string
}

export const Panel: React.FC<PropsWithChildren<PanelProps>> = ({ children, id, className }) => {
  let __styles = styleHandler('tabs')

  return (
    <TabsPrimitive.Content value={id} className={[__styles.content, className].join(' ')}>
      {children}
    </TabsPrimitive.Content>
  )
}

Tabs.Panel = Panel
export default Tabs
