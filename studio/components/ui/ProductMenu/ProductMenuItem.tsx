import Link from 'next/link'
import { FC, ReactNode } from 'react'
import { Button, IconExternalLink, Menu } from '@supabase/ui'

interface Props {
  name: string | ReactNode
  isActive: boolean
  isExternal?: boolean
  icon?: ReactNode
  action?: ReactNode
  url?: string
  target?: '_blank' | '_self'
  onClick?: () => void
  textClassName?: string
  hoverText?: string
}

const ProductMenuItem: FC<Props> = ({
  name = '',
  isActive,
  isExternal,
  icon,
  action,
  url = '',
  target = '_self',
  onClick,
  textClassName = '',
  hoverText = '',
}) => {
  const menuItem = (
    <Menu.Item icon={icon} rounded active={isActive} onClick={onClick}>
      <div className="flex w-full items-center justify-between">
        <span
          title={hoverText ? hoverText : typeof name === 'string' ? name : ''}
          className={'flex items-center truncate ' + textClassName}
        >
          {name}
        </span>
        {action}
      </div>
    </Menu.Item>
  )

  if (url) {
    if (isExternal) {
      return (
        <Link href={url}>
          <a target="_blank">
            <Button block className="!justify-start" type="text" size="small" icon={icon}>
              {name}
            </Button>
          </a>
        </Link>
      )
    }

    return (
      <Link href={url} passHref>
        <a className="block" target={target}>
          {menuItem}
        </a>
      </Link>
    )
  }

  return menuItem
}

export default ProductMenuItem
