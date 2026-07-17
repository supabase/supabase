'use client'

import { cva } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'
import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react'
import { cn } from 'ui'

import { useTocRerenderTrigger } from '../docs/GuidesMdx.state'
import { useStickyTabs, UseStickyTabsOptions } from './useStickyTabs'
import { useTabsWithQueryParams, UseTabsWithQueryParamsOptions } from './useTabsWithQueryParams'

export interface TabsProps {
  children: ReactNode
  type?: 'pills' | 'underlined' | 'cards' | 'rounded-pills'
  defaultActiveId?: string
  activeId?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  block?: boolean
  onChange?: (id: string) => void
  onClick?: any
  scrollable?: boolean
  wrappable?: boolean
  addOnBefore?: React.ReactNode
  addOnAfter?: React.ReactNode
  listClassNames?: string
  baseClassNames?: string
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

const isString = (maybeStr: unknown): maybeStr is string => typeof maybeStr === 'string'

export const Tabs = ({
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
  children,
  queryGroup,
  stickyTabList,
}: TabsProps &
  Pick<UseTabsWithQueryParamsOptions, 'queryGroup'> & {
    stickyTabList?: UseStickyTabsOptions
  }) => {
  const childrenArr: ReactElement<TabPanelProps>[] = []
  const tabIds: string[] = []
  Children.forEach(children, (child) => {
    if (isValidElement<TabPanelProps>(child) && isString(child.props.id)) {
      childrenArr.push(child)
      tabIds.push(child.props.id)
    }
  })
  const { queryTab, onTabSelected: onTabSelectedForQuery } = useTabsWithQueryParams({
    tabIds,
    queryGroup,
  })

  const sanitizedStickyTabList = useMemo(
    () =>
      stickyTabList != undefined
        ? {
            ...stickyTabList,
            // Magic number is the height of tab list + paragraph margin, worth getting
            // rid of this?
            scrollMarginTop:
              stickyTabList.scrollMarginTop || 'calc(var(--header-height) + 43px + 20px)',
          }
        : undefined,
    [stickyTabList]
  )
  const {
    observedRef,
    stickyRef,
    onTabSelected: onTabSelectedForSticky,
  } = useStickyTabs(sanitizedStickyTabList)
  const rerenderToc = useTocRerenderTrigger()

  const [activeTab, setActiveTab] = useState(
    queryTab ??
      activeId ??
      defaultActiveId ??
      // if no defaultActiveId is set use the first panel
      childrenArr?.[0]?.props?.id
  )

  useEffect(() => {
    // If we have a queryTab, Tabs is controller by URL params
    if (queryTab && queryTab !== activeTab) {
      setActiveTab(queryTab)
      return
    }
    if (activeId && activeId !== activeTab) {
      setActiveTab(activeId)
    }
  }, [activeId, activeTab, queryTab])

  const onTabClick = useCallback(
    (id: string) => {
      if (id !== activeTab) {
        setActiveTab(id)
        onTabSelectedForSticky()
        onTabSelectedForQuery(id)
        rerenderToc()
        onChange?.(id)
        onClick?.(id)
      }
    },
    [
      activeTab,
      onTabSelectedForSticky,
      onTabSelectedForQuery,
      rerenderToc,
      onChange,
      onClick,
      setActiveTab,
    ]
  )
  return (
    <TabsPrimitive.Root
      value={activeTab}
      className={cn('w-full justify-between space-y-4', baseClassNames)}
      ref={observedRef}
    >
      <TabsPrimitive.List
        className={tabsListVariants({
          type,
          scrollable,
          wrappable,
          className: cn({ 'bg-background': stickyTabList != null }, listClassNames),
        })}
        ref={stickyRef}
      >
        {addOnBefore}
        {childrenArr.map((tab) => {
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
      {childrenArr}
    </TabsPrimitive.Root>
  )
}

interface TabPanelProps {
  children: ReactNode
  id: string
  label?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  className?: string
}

export const TabPanel = ({ children, id, className }: TabPanelProps) => {
  return (
    <TabsPrimitive.Content
      value={id}
      className={cn('focus:outline-hidden transition-height', className)}
      tabIndex={-1}
    >
      {children}
    </TabsPrimitive.Content>
  )
}
