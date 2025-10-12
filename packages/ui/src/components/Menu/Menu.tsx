'use client'

import React from 'react'
import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'
import Typography from '../Typography'
import { MenuContextProvider, useMenuContext } from './MenuContext'

interface MenuProps {
  children: React.ReactNode
  className?: string
  ulClassName?: string
  style?: React.CSSProperties
  type?: 'text' | 'pills' | 'border'
}

/**
 * A menu component that displays a list of items.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The menu items.
 * @param {string} [props.className] - Additional CSS class names for the nav element.
 * @param {string} [props.ulClassName] - Additional CSS class names for the ul element.
 * @param {React.CSSProperties} [props.style] - Inline CSS styles.
 * @param {'text' | 'pills' | 'border'} [props.type='text'] - The visual style of the menu.
 * @returns {React.ReactElement} The menu component.
 */
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

/**
 * An item within a Menu component.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content of the menu item.
 * @param {React.ReactNode} [props.icon] - An icon to be displayed next to the item.
 * @param {boolean} [props.active] - If `true`, the item will be styled as active.
 * @param {boolean} [props.rounded] - If `true`, the item will have rounded corners.
 * @param {Function} [props.onClick] - A callback function to be called when the item is clicked.
 * @param {boolean} [props.doNotCloseOverlay=false] - If `true`, the overlay will not close when the item is clicked.
 * @param {boolean} [props.showActiveBar=false] - If `true`, a bar will be displayed next to the active item.
 * @param {React.CSSProperties} [props.style] - Inline CSS styles.
 * @returns {React.ReactElement} The menu item component.
 */
export function Item({
  children,
  icon,
  active,
  rounded,
  onClick,
  doNotCloseOverlay = false,
  showActiveBar = false,
  style,
}: ItemProps) {
  const __styles = styleHandler('menu')

  const { type } = useMenuContext()

  let classes = [__styles.item.base]

  classes.push(__styles.item.variants[type].base)

  if (active) {
    classes.push(__styles.item.variants[type].active)
  } else {
    classes.push(__styles.item.variants[type].normal)
  }

  let contentClasses = [__styles.item.content.base]
  if (active) {
    contentClasses.push(__styles.item.content.active)
  } else {
    contentClasses.push(__styles.item.content.normal)
  }

  let iconClasses = [__styles.item.icon.base]
  if (active) {
    iconClasses.push(__styles.item.icon.active)
  } else {
    iconClasses.push(__styles.item.icon.normal)
  }

  return (
    <li
      role="menuitem"
      className={cn('outline-none', classes)}
      style={style}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {icon && <div className={`${iconClasses.join(' ')} min-w-fit`}>{icon}</div>}
      <span className={contentClasses.join(' ')}>{children}</span>
    </li>
  )
}

interface GroupProps {
  children?: React.ReactNode
  icon?: React.ReactNode
  title: React.ReactNode
}

/**
 * A group of menu items.
 * @param {object} props - The component props.
 * @param {React.ReactNode} [props.children] - The menu items within the group.
 * @param {React.ReactNode} [props.icon] - An icon for the group title.
 * @param {React.ReactNode} props.title - The title of the group.
 * @returns {React.ReactElement} The menu group component.
 */
export function Group({ children, icon, title }: GroupProps) {
  const __styles = styleHandler('menu')
  const { type } = useMenuContext()
  return (
    <div className={[__styles.group.base, __styles.group.variants[type]].join(' ')}>
      {icon && <span className={__styles.group.icon}>{icon}</span>}
      <span className={__styles.group.content}>{title}</span>
      {children}
    </div>
  )
}

interface MiscProps {
  children: React.ReactNode
}

/**
 * A miscellaneous item within a Menu component, typically used for non-interactive text.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content of the miscellaneous item.
 * @returns {React.ReactElement} The miscellaneous menu item component.
 */
export function Misc({ children }: MiscProps) {
  return (
    <div
    // className={MenuStyles['sbui-menu__misc']}
    >
      <Typography.Text>
        <span
        // className={MenuStyles['sbui-menu__content']}
        >
          {children}
        </span>
      </Typography.Text>
    </div>
  )
}

Menu.Item = Item
Menu.Group = Group
Menu.Misc = Misc
export default Menu
