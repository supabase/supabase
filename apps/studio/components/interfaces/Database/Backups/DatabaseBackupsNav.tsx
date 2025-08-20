import Link from 'next/link'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Badge, NavMenu, NavMenuItem } from 'ui'
import { getPathReferences } from '../../../../data/vela/path-references'

type Props = {
  active: 'pitr' | 'scheduled' | 'rtnp'
}

function DatabaseBackupsNav({ active }: Props) {
  const { slug } = getPathReferences()
  const { ref, cloud_provider } = useSelectedProjectQuery()?.data || {}

  const navMenuItems = [
    {
      enabled: true,
      id: 'scheduled',
      label: 'Scheduled backups',
      href: `/org/${slug}/project/${ref}/database/backups/scheduled`,
    },
    {
      enabled: true,
      id: 'pitr',
      label: 'Point in time',
      href: `/org/${slug}/project/${ref}/database/backups/pitr`,
    },
    {
      enabled: cloud_provider !== 'FLY',
      id: 'rtnp',
      label: (
        <div className="flex items-center gap-1">
          Restore to new project{' '}
          <Badge size="small" className="!text-[10px] px-1.5 py-0">
            New
          </Badge>
        </div>
      ),
      href: `/org/${slug}/project/${ref}/database/backups/restore-to-new-project`,
    },
  ] as const

  return (
    <NavMenu className="overflow-hidden overflow-x-auto">
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
