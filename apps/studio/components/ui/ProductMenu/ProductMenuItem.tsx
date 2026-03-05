import Link from 'next/link'
import { Badge, Button, Menu } from 'ui'
import { ProductMenuGroupItem } from './ProductMenu.types'

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
  const { name = '', url = '', icon, rightIcon, isExternal, label, disabled } = item

  const menuItem = (
    <Menu.Item icon={icon} active={isActive} onClick={onClick}>
      <div className="flex w-full items-center justify-between gap-1">
        <div
          className="flex items-center gap-1 min-w-0 flex-1"
          title={hoverText ? hoverText : typeof name === 'string' ? name : ''}
        >
          <span className="truncate flex-1 min-w-0">{name}</span>
          {label !== undefined && (
            <Badge
              className="flex-shrink-0"
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
      return (
        <Button asChild block className="!justify-start" type="text" size="small" icon={icon}>
          <Link href={url} target="_blank" rel="noreferrer">
            {name}
          </Link>
        </Button>
      )
    }

    return (
      <Link href={url} className="block" target={target}>
        {menuItem}
      </Link>
    )
  }

  return menuItem
}
