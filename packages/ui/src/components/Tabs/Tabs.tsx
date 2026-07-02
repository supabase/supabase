'use client'

import { cva } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'
import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
  type RefObject,
} from 'react'

import { cn } from '../../lib/utils'

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

interface TabsSubComponents {
  Panel: React.FC<PropsWithChildren<PanelProps>>
}

export const tabsListVariants = cva(cn('flex'), {
  variants: {
    type: {
      pills: 'space-x-1',
      underlined: 'items-center border-b border-secondary',
      cards: '',
      'rounded-pills': 'flex-wrap gap-2',
    },
    scrollable: {
      true: 'overflow-auto whitespace-nowrap no-scrollbar mask-fadeout-right',
    },
    wrappable: {
      true: 'flex-wrap',
    },
  },
})

export const tabsTriggerListVariants = cva(
  cn(
    'relative cursor-pointer flex items-center space-x-2 text-center transition focus:outline-hidden focus-visible:ring-3 focus-visible:ring-foreground-muted focus-visible:border-foreground-muted'
  ),
  {
    variants: {
      type: {
        pills: 'shadow-xs rounded-sm border',
        underlined: 'text-foreground-lighter',
        cards: '',
        'rounded-pills': 'shadow-xs rounded-full',
      },
      size: {
        tiny: 'text-xs px-2.5 py-1',
        small: 'text-base md:text-sm leading-4 px-3 py-2',
        medium: 'text-base md:text-sm px-4 py-2',
        large: 'text-base px-4 py-2',
        xlarge: 'text-base px-6 py-3',
      },
      block: {
        true: 'w-full flex items-center justify-center',
      },
      isActive: {
        false: 'hover:text-foreground',
      },
    },
    compoundVariants: [
      {
        type: 'pills',
        isActive: true,
        className: 'bg-selection text-foreground border-stronger',
      },
      {
        type: 'pills',
        isActive: false,
        className:
          'bg-background border-strong hover:border-foreground-muted text-foreground-muted',
      },
      {
        type: 'underlined',
        isActive: true,
        className: '!text-foreground border-b-2 border-foreground',
      },
      {
        type: 'rounded-pills',
        isActive: true,
        className: 'bg-foreground text-background border-foreground',
      },
      {
        type: 'rounded-pills',
        isActive: false,
        className:
          'bg-surface-200 hover:bg-surface-300 hover:border-foreground-lighter text-foreground-lighter',
      },
    ],
  }
)

/**
 * @deprecated Use `import { Tabs_shadcn_ } from "ui"` instead
 */
const Tabs: React.FC<PropsWithChildren<TabsProps>> & TabsSubComponents = ({
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
    <TabsPrimitive.Root
      value={activeTab}
      className={cn('w-full justify-between space-y-4', baseClassNames)}
      ref={refs?.base}
    >
      <TabsPrimitive.List
        className={tabsListVariants({ type, scrollable, wrappable, className: listClassNames })}
        ref={refs?.list}
      >
        {addOnBefore}
        {children.map((tab) => {
          const isActive = activeTab === tab.props.id

          return (
            <TabsPrimitive.Trigger
              onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onTabClick(tab.props.id)
                }
              }}
              onClick={() => onTabClick(tab.props.id)}
              key={`${tab.props.id}-tab-button`}
              value={tab.props.id}
              className={tabsTriggerListVariants({ type, isActive, size, block })}
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

/**
 * @deprecated Use ./TabsContent_Shadcn_ instead
 */
export const Panel: React.FC<PropsWithChildren<PanelProps>> = ({ children, id, className }) => {
  return (
    <TabsPrimitive.Content
      value={id}
      className={cn('focus:outline-hidden transition-height', className)}
    >
      {children}
    </TabsPrimitive.Content>
  )
}

Tabs.Panel = Panel
export default Tabs
