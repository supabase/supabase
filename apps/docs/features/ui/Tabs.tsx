'use client'

import { cva } from 'class-variance-authority'
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
import { cn, TabsContent, TabsIndicator, TabsList, Tabs as TabsRoot, TabsTrigger } from 'ui'

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
      pills: 'border-b-0 space-x-1',
      // fix focus ring so it is not clipped
      underlined: cn(
        'relative items-center',
        'ps-(--tab-lead) -ms-(--tab-lead) [--tab-track-inset:var(--tab-lead)]',
        '[--tab-track:var(--border-secondary)]'
      ),
      cards: 'border-b-0',
      'rounded-pills': 'border-b-0 flex-wrap gap-2',
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
    'relative cursor-pointer flex items-center gap-2 text-center transition-colors',
    'focus-inset rounded-md',
    '[&_img]:m-0 [&_img]:size-3.5 [&_svg]:size-3.5'
  ),
  {
    variants: {
      type: {
        pills: 'border-b-0 data-[state=active]:border-b-stronger shadow-xs rounded-sm border',
        underlined: 'text-foreground-lighter data-[state=active]:shadow-none',
        cards: 'border-b-0',
        'rounded-pills':
          'border-b-0 data-[state=active]:border-b-foreground shadow-xs rounded-full',
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
        className: '!text-foreground',
      },
      { type: 'underlined', className: 'py-3 first:-ms-(--tab-lead)' },
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

const TAB_LEAD: Record<NonNullable<TabsProps['size']>, string> = {
  tiny: 'calc(var(--spacing) * 2.5)',
  small: 'calc(var(--spacing) * 3)',
  medium: 'calc(var(--spacing) * 4)',
  large: 'calc(var(--spacing) * 4)',
  xlarge: 'calc(var(--spacing) * 6)',
}

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
    <TabsRoot
      value={activeTab}
      className={cn('w-full justify-between space-y-4', baseClassNames)}
      ref={observedRef}
    >
      <TabsList
        style={{ '--tab-lead': TAB_LEAD[size] } as React.CSSProperties}
        className={tabsListVariants({
          type,
          scrollable,
          wrappable,
          className: cn('not-prose', { 'bg-background': stickyTabList != null }, listClassNames),
        })}
        ref={stickyRef}
      >
        {addOnBefore}
        {childrenArr.map((tab) => {
          const isActive = activeTab === tab.props.id

          return (
            <TabsTrigger
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
            </TabsTrigger>
          )
        })}
        {addOnAfter}
        {type === 'underlined' ? <TabsIndicator /> : null}
      </TabsList>
      {childrenArr}
    </TabsRoot>
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
    <TabsContent value={id} className={cn('mt-0 focus:outline-hidden', className)} tabIndex={-1}>
      {children}
    </TabsContent>
  )
}
