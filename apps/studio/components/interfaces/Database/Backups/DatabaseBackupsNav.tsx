import { useFlag } from 'hooks/ui/useFlag'
import Link from 'next/link'
import React from 'react'

import { NavMenu, NavMenuItem } from 'ui'

type Props = {
  projRef: string
  active: string
}

function DatabaseBackupsNav({ projRef, active }: Props) {
  const isCloneToNewProjectEnabled = useFlag('clonetonewproject')

  const navMenuItems = [
    {
      enabled: true,
      id: 'scheduled',
      label: 'Scheduled backups',
      href: `/project/${projRef}/database/backups/scheduled`,
    },
    {
      enabled: true,
      id: 'pitr',
      label: 'Point in time',
      href: `/project/${projRef}/database/backups/pitr`,
    },
    {
      enabled: isCloneToNewProjectEnabled,
      id: 'rtnp',
      label: 'Restore to new project',
      href: `/project/${projRef}/database/backups/restore-to-new-project`,
    },
  ] as const

  return (
    <NavMenu>
      {navMenuItems.map(
        (item) =>
          item.enabled && (
            <NavMenuItem key={item.label} active={item.id === active}>
              <Link href={item.href}>{item.label}</Link>
            </NavMenuItem>
          )
      )}
    </NavMenu>
  )
}

export default DatabaseBackupsNav
