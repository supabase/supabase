import { FC, ReactNode } from 'react'
import Link from 'next/link'
import { Menu, Typography } from '@supabase/ui'

interface Props {
  name: string | ReactNode
  isActive: boolean
  icon?: ReactNode
  action?: ReactNode
  url?: string
  target?: '_blank' | '_self'
  onClick?: () => void
}

const ProductMenuItem: FC<Props> = ({
  name,
  isActive,
  icon,
  action,
  url = '',
  target = '_self',
  onClick,
}) => {
  const menuItem = (
    <Menu.Item icon={icon} rounded active={isActive} onClick={onClick}>
      <div className="flex w-full justify-between">
        <Typography.Text className="truncate flex items-center">{name}</Typography.Text>
        {action}
      </div>
    </Menu.Item>
  )

  if (url) {
    return (
      <Link href={url}>
        <a className="block" target={target}>
          {menuItem}
        </a>
      </Link>
    )
  }

  return menuItem
}

export default ProductMenuItem
