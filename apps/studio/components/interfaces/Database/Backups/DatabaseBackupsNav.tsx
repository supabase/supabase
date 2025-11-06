import Link from 'next/link'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Badge, NavMenu, NavMenuItem } from 'ui'

type Props = {
  active: 'pitr' | 'scheduled' | 'rtnp'
}

function DatabaseBackupsNav({ active }: Props) {
  const { ref, cloud_provider } = useSelectedProjectQuery()?.data || {}
  const { databaseRestoreToNewProject } = useIsFeatureEnabled(['database:restore_to_new_project'])

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
      enabled: databaseRestoreToNewProject && cloud_provider !== 'FLY',
      id: 'rtnp',
      label: (
        <div className="flex items-center gap-2">
          Restore to new project <Badge size="small">Beta</Badge>
        </div>
      ),
      href: `/project/${ref}/database/backups/restore-to-new-project`,
    },
  ] as const

  const menuItems = navMenuItems.map(
    (item) =>
      item.enabled && (
        <NavMenuItem key={item.id} active={item.id === active}>
          <Link href={item.href}>{item.label}</Link>
        </NavMenuItem>
      )
  )

  return <NavMenu className="overflow-hidden overflow-x-auto">{menuItems}</NavMenu>
}

export default DatabaseBackupsNav
