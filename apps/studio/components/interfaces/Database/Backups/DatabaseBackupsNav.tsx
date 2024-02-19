import Link from 'next/link'
import React from 'react'
import { NavMenu, NavMenuItem } from 'ui'

type Props = {
  projRef: string
  active: 'scheduled' | 'pitr'
}

function DatabaseBackupsNav({ projRef, active }: Props) {
  const navMenuItems = [
    {
      id: 'scheduled',
      label: 'Scheduled backups',
      href: `/project/${projRef}/database/backups/scheduled`,
    },
    {
      id: 'pitr',
      label: 'Point in time',
      href: `/project/${projRef}/database/backups/pitr`,
    },
  ]

  return (
    <NavMenu>
      {navMenuItems.map((item) => (
        <NavMenuItem key={item.label} active={item.id === active}>
          <Link href={item.href}>{item.label}</Link>
        </NavMenuItem>
      ))}
    </NavMenu>
  )
}

export default DatabaseBackupsNav
