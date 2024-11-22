import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFlag } from 'hooks/ui/useFlag'
import Link from 'next/link'
import React from 'react'

import { Badge, NavMenu, NavMenuItem } from 'ui'

type Props = {
  active: 'pitr' | 'scheduled' | 'rtnp'
}

function DatabaseBackupsNav({ active }: Props) {
  const isCloneToNewProjectEnabled = useFlag('clonetonewproject')
  const ref = useProjectContext()?.project?.ref

  const navMenuItems = [
    {
      enabled: true,
      id: 'scheduled',
      label: 'Scheduled backups',
      href: `/project/${ref}/database/backups/scheduled`,
    },
    {
      enabled: true,
      id: 'pitr',
      label: 'Point in time',
      href: `/project/${ref}/database/backups/pitr`,
    },
    {
      enabled: isCloneToNewProjectEnabled,
      id: 'rtnp',
      label: (
        <div className="flex items-center gap-1">
          Restore to new project{' '}
          <Badge size="small" className="!text-[10px] px-1.5 py-0">
            New
          </Badge>
        </div>
      ),
      href: `/project/${ref}/database/backups/restore-to-new-project`,
    },
  ] as const

  return (
    <NavMenu>
      {navMenuItems.map(
        (item) =>
          item.enabled && (
            <NavMenuItem key={item.id} active={item.id === active}>
              <Link href={item.href}>{item.label}</Link>
            </NavMenuItem>
          )
      )}
    </NavMenu>
  )
}

export default DatabaseBackupsNav
