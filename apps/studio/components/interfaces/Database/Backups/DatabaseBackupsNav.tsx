import Link from 'next/link'
import React from 'react'

import { useParams } from 'common'
import { NavMenu, NavMenuItem } from 'ui'

type Props = {
  active: 'scheduled' | 'pitr'
}

function DatabaseBackupsNav({ active }: Props) {
  const { ref } = useParams()

  const navMenuItems = [
    {
      id: 'scheduled',
      label: 'Scheduled backups',
      href: `/project/${ref}/database/backups/scheduled`,
    },
    {
      id: 'pitr',
      label: 'Point in time',
      href: `/project/${ref}/database/backups/pitr`,
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
