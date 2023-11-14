import { noop } from 'lodash'
import Link from 'next/link'
import { IconArrowUpRight, IconLogOut, Menu } from 'ui'

interface SidebarItemProps {
  id: any
  label: string
  href?: string
  isActive?: boolean
  isSubitem?: boolean
  isExternal?: boolean
  onClick?: () => void
}

const SidebarItem = ({
  id,
  label,
  href,
  isActive = false,
  isSubitem = false,
  isExternal = false,
  onClick = noop,
}: SidebarItemProps) => {
  if (href === undefined) {
    const icon = isExternal ? (
      <IconArrowUpRight size="tiny" />
    ) : label === 'Logout' ? (
      <IconLogOut size="tiny" />
    ) : undefined

    return (
      <Menu.Item
        rounded
        key={id}
        style={{ marginLeft: isSubitem ? '.5rem' : '0' }}
        active={isActive}
        onClick={onClick}
        icon={icon}
      >
        {isSubitem ? <p className="text-sm">{label}</p> : label}
      </Menu.Item>
    )
  }

  return (
    <Link href={href || ''} className="block" target={isExternal ? '_blank' : '_self'}>
      <button
        className={[
          'group border-default ring-foreground group-hover:border-foreground-muted',
          'flex max-w-full cursor-pointer items-center space-x-2 py-1 font-normal',
          'outline-none focus-visible:z-10 focus-visible:ring-1',
        ].join(' ')}
        onClick={onClick}
      >
        {isExternal && (
          <span className="truncate text-sm text-foreground-lighter transition group-hover:text-foreground-light">
            <IconArrowUpRight size="tiny" />
          </span>
        )}
        <span
          title={label}
          className="w-full truncate text-sm text-foreground-light transition group-hover:text-foreground"
        >
          {isSubitem ? <p>{label}</p> : label}
        </span>
      </button>
    </Link>
  )
}

export default SidebarItem
