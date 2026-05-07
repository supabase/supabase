import Link from 'next/link'
import { Badge, Button, Menu } from 'ui'

import { ProductMenuGroupItem } from './ProductMenu.types'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'

interface ProductMenuItemProps {
  item: ProductMenuGroupItem
  isActive: boolean
  target?: '_blank' | '_self'
  hoverText?: string
  onClick?: () => void
}

export const ProductMenuItem = ({
  item,
  isActive,
  target = '_self',
  hoverText = '',
  onClick,
}: ProductMenuItemProps) => {
  const { name = '', url = '', icon, rightIcon, isExternal, label, disabled, shortcutId } = item

  const menuItem = (
    <Menu.Item icon={icon} active={isActive} onClick={onClick}>
      <div className="flex w-full items-center justify-between gap-1">
        <div
          className="flex items-center gap-1 min-w-0 flex-1"
          title={
            shortcutId ? undefined : hoverText ? hoverText : typeof name === 'string' ? name : ''
          }
        >
          <span className="truncate flex-1 min-w-0">{name}</span>
          {label !== undefined && (
            <Badge
              className="shrink-0"
              variant={label.toLowerCase() === 'new' ? 'success' : 'warning'}
            >
              {label}
            </Badge>
          )}
        </div>
        {rightIcon && <div>{rightIcon}</div>}
      </div>
    </Menu.Item>
  )

  if (disabled) {
    return <div className="opacity-50 pointer-events-none">{menuItem}</div>
  }

  if (url) {
    if (isExternal) {
      const externalLink = (
        <Button asChild block className="justify-start!" type="text" size="small" icon={icon}>
          <Link href={url} target="_blank" rel="noreferrer">
            {name}
          </Link>
        </Button>
      )

      return shortcutId ? (
        <ShortcutTooltip shortcutId={shortcutId} side="right" delayDuration={1000}>
          {externalLink}
        </ShortcutTooltip>
      ) : (
        externalLink
      )
    }

    const link = (
      <Link href={url} className="block" target={target} onClick={onClick}>
        {menuItem}
      </Link>
    )

    return shortcutId ? (
      <ShortcutTooltip shortcutId={shortcutId} side="right" delayDuration={1000}>
        {link}
      </ShortcutTooltip>
    ) : (
      link
    )
  }

  return menuItem
}
