'use client'

import { cva } from 'class-variance-authority'
import React from 'react'

import { cn } from '../../lib/utils/cn'
import { MenuContextProvider, useMenuContext } from './MenuContext'

interface MenuProps {
  children: React.ReactNode
  className?: string
  ulClassName?: string
  style?: React.CSSProperties
  type?: 'text' | 'pills' | 'border'
}

function Menu({ children, className, ulClassName, style, type = 'text' }: MenuProps) {
  return (
    <nav
      role="menu"
      aria-label="Sidebar"
      aria-orientation="vertical"
      aria-labelledby="options-menu"
      className={className}
      style={style}
    >
      <MenuContextProvider type={type}>
        <ul className={ulClassName}>{children}</ul>
      </MenuContextProvider>
    </nav>
  )
}

interface ItemProps {
  children: React.ReactNode
  icon?: React.ReactNode
  active?: boolean
  rounded?: boolean
  onClick?: any
  doNotCloseOverlay?: boolean
  showActiveBar?: boolean
  style?: React.CSSProperties
}

export const menuItemVariants = cva(
  cn(
    'cursor-pointer flex space-x-3 items-center outline-hidden focus-visible:ring-1 ring-foreground-muted focus-visible:z-10 group'
  ),
  {
    variants: {
      type: {
        text: 'py-1',
        border: 'px-4 py-1',
        pills: 'my-px px-3 py-[3px] rounded-md transition-colors active:bg-sidebar-accent/50',
      },
      active: {
        true: 'font-semibold z-10',
        false: 'font-normal border-default group-hover:border-foreground-muted',
      },
    },
    compoundVariants: [
      {
        type: 'text',
        active: true,
        className: 'text-foreground-muted',
      },
      {
        type: 'border',
        active: true,
        className: 'text-foreground-muted border-l border-brand group-hover:border-brand',
      },
      {
        type: 'border',
        active: false,
        className: 'border-l',
      },
      {
        type: 'pills',
        active: true,
        className: 'bg-sidebar-accent text-foreground-lighter',
      },
      {
        type: 'pills',
        active: false,
        className: 'hover:bg-sidebar-accent/50',
      },
    ],
    defaultVariants: {
      active: false,
    },
  }
)

export function Item({ children, icon, active, onClick, style }: ItemProps) {
  const { type } = useMenuContext()

  return (
    <li
      role="menuitem"
      className={cn('outline-hidden', menuItemVariants({ type, active }))}
      style={style}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {icon && (
        <div
          className={cn('transition truncate text-sm min-w-fit', {
            'text-foreground-lighter group-hover:text-foreground-light': !active,
            'text-foreground': active,
          })}
        >
          {icon}
        </div>
      )}
      <span
        className={cn('transition truncate text-sm', {
          'text-foreground-light group-hover:text-foreground': !active,
          'text-foreground font-semibold': active,
        })}
      >
        {children}
      </span>
    </li>
  )
}

interface GroupProps {
  children?: React.ReactNode
  icon?: React.ReactNode
  title: React.ReactNode
}

export function Group({ children, icon, title }: GroupProps) {
  const { type } = useMenuContext()
  return (
    <div
      className={cn('flex space-x-3 mb-2 font-normal', {
        'px-3': type === 'pills',
      })}
    >
      {icon && <span className="text-foreground-lighter">{icon}</span>}
      <span className="text-sm text-foreground-lighter w-full">{title}</span>
      {children}
    </div>
  )
}

Menu.Item = Item
Menu.Group = Group
export default Menu
