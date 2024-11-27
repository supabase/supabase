import Link from 'next/link'
import { ReactNode } from 'react'
import { Badge, Button, Menu } from 'ui'

interface ProductMenuItemProps {
  name: string | ReactNode
  isActive: boolean
  isExternal?: boolean
  icon?: ReactNode
  rightIcon?: ReactNode
  url?: string
  target?: '_blank' | '_self'
  onClick?: () => void
  textClassName?: string
  hoverText?: string
  label?: string
}

const ProductMenuItem = ({
  name = '',
  isActive,
  isExternal,
  icon,
  rightIcon,
  url = '',
  target = '_self',
  onClick,
  textClassName = '',
  hoverText = '',
  label,
}: ProductMenuItemProps) => {
  const menuItem = (
    <Menu.Item icon={icon} rounded active={isActive} onClick={onClick}>
      <div className="flex w-full items-center justify-between gap-1">
        <div
          title={hoverText ? hoverText : typeof name === 'string' ? name : ''}
          className={'flex items-center gap-2 truncate w-full ' + textClassName}
        >
          <span className="truncate">{name} </span>
          {label !== undefined && (
            <Badge variant="warning" className="py-0 px-1.5">
              {label}
            </Badge>
          )}
        </div>
        {rightIcon && <div>{rightIcon}</div>}
      </div>
    </Menu.Item>
  )

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

export default ProductMenuItem
