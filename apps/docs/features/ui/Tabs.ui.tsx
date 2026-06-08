'use client'

import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
  type RefObject,
} from 'react'
import {
  Button,
  cn,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'

export interface TabsProps {
  type?: 'pills' | 'underlined' | 'cards' | 'rounded-pills'
  defaultActiveId?: string
  activeId?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
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
  refs?: {
    base: RefObject<HTMLDivElement> | ((elem: HTMLDivElement | null) => void)
    list: RefObject<HTMLDivElement> | ((elem: HTMLDivElement | null) => void)
  }
}

const Tabs: React.FC<PropsWithChildren<TabsProps>> = ({
  defaultActiveId,
  activeId,
  type = 'pills',
  size = 'tiny',
  block,
  onChange,
  onClick,
  scrollable,
  wrappable,
  addOnBefore,
  addOnAfter,
  listClassNames,
  baseClassNames,
  refs,
  children: _children,
}) => {
  // Children.toArray clones elements (to assign keys) and accesses element.ref
  // internally, which triggers a React 19 warning. Children.forEach iterates
  // without cloning, so it never touches .ref
  // todo: remove this when we upgrade the radix packages to support react 19
  const childrenArr: PanelPropsProps[] = []
  Children.forEach(_children, (child) => {
    if (isValidElement(child)) childrenArr.push(child as unknown as PanelPropsProps)
  })
  const children = childrenArr

  const [activeTab, setActiveTab] = useState(
    activeId ??
      defaultActiveId ??
      // if no defaultActiveId is set use the first panel
      children?.[0]?.props?.id
  )

  useMemo(() => {
    if (activeId && activeId !== activeTab) setActiveTab(activeId)
  }, [activeId])

  function onTabClick(id: string) {
    onClick?.(id)
    if (id !== activeTab) {
      onChange?.(id)
      setActiveTab(id)
    }
  }

  return (
    <Tabs_Shadcn_ value={activeTab} className={baseClassNames} ref={refs?.base}>
      <TabsList_Shadcn_
        className={cn(
          scrollable && 'overflow-auto whitespace-nowrap no-scrollbar mask-fadeout-right',
          wrappable && 'flex-wrap',
          listClassNames
        )}
        ref={refs?.list}
      >
        {addOnBefore}
        {children.map((tab) => {
          return (
            <TabsTrigger_Shadcn_
              onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onTabClick(tab.props.id)
                }
              }}
              onClick={() => onTabClick(tab.props.id)}
              key={`${tab.props.id}-tab-button`}
              value={tab.props.id}
              asChild={type === 'pills'}
            >
              {type === 'pills' ? (
                <Button type="default" iconLeft={tab.props.icon} iconRight={tab.props.iconRight}>
                  <span>{tab.props.label}</span>
                </Button>
              ) : (
                <>
                  {tab.props.icon}
                  <span>{tab.props.label}</span>
                  {tab.props.iconRight}
                </>
              )}
            </TabsTrigger_Shadcn_>
          )
        })}
        {addOnAfter}
      </TabsList_Shadcn_>
      {children as any}
    </Tabs_Shadcn_>
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

const TabPanel: React.FC<PropsWithChildren<PanelProps>> = ({ children, id, className }) => {
  return (
    <TabsContent_Shadcn_ value={id} className={className}>
      {children}
    </TabsContent_Shadcn_>
  )
}

export { TabPanel, Tabs }
