import * as TabsPrimitive from '@radix-ui/react-tabs'
import { useSearchParamsShallow } from 'common'
import {
  Children,
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PropsWithChildren,
} from 'react'
import styleHandler from '../../lib/theme/styleHandler'
import { useTabGroup } from './TabsProvider'
import { useSticky } from './Tabs.utils'

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
  stickyTabList?: { style?: CSSStyleDeclaration }
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
  stickyTabList,
  listClassNames,
  baseClassNames,
  children: _children,
}) => {
  // toArray is used here to filter out invalid children
  // another method would be to use React.Children.map
  const children = Children.toArray(_children) as PanelPropsProps[]
  const tabIds = children.map((tab) => tab.props.id)

  const searchParams = useSearchParamsShallow()
  const queryTabRaw = queryGroup && searchParams.get(queryGroup)
  const queryTab = queryTabRaw && tabIds.includes(queryTabRaw) ? queryTabRaw : undefined

  const [activeTab, setActiveTab] = useState(
    queryTab ??
      defaultActiveId ??
      // if no defaultActiveId is set use the first panel
      children?.[0]?.props?.id
  )

  const { inView, observedRef, stickyRef } = useSticky<HTMLDivElement>({
    enabled: !!stickyTabList,
    ...stickyTabList,
  })

  const { groupActiveId, setGroupActiveId } = useTabGroup(tabIds)

  /**
   * Can't shortcut the render here by taking this out of useEffect because
   * `setActiveGroupId` comes from `TabProvider`
   */
  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab)
      setGroupActiveId?.(queryTab)
    }
  }, [queryTab])

  const active = activeId ?? groupActiveId ?? activeTab

  let __styles = styleHandler('tabs')

  function onTabClick(id: string) {
    if (queryGroup) {
      if (!searchParams.getAll('queryGroups').includes(queryGroup)) {
        searchParams.append('queryGroups', queryGroup)
      }
      searchParams.set(queryGroup, id)
    }

    if (stickyTabList && inView && stickyRef.current) {
      let elem = stickyRef.current as Element | null
      while (elem && !elem.matches('[role="tabpanel"][data-state="active"]')) {
        elem = elem.nextElementSibling
      }
      if (!elem) return

      const top = elem.getBoundingClientRect().top
      ;(elem as HTMLElement).style.scrollMarginTop = 'calc(var(--header-height)*3)'
      if (top < 0)
        elem.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: no-preference)').matches
            ? 'smooth'
            : 'instant',
        })
    }

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
    <TabsPrimitive.Root
      value={active}
      className={[__styles.base, baseClassNames].join(' ')}
      ref={observedRef}
    >
      <TabsPrimitive.List className={listClasses.join(' ')} ref={stickyRef}>
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
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onTabClick(tab.props.id)
                }
              }}
              onClick={(e: MouseEvent<HTMLButtonElement>) => onTabClick(tab.props.id)}
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
