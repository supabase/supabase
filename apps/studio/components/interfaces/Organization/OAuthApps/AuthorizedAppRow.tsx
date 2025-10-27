import { Trash } from 'lucide-react'

import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import type { AuthorizedApp } from 'data/oauth/authorized-apps-query'
import { Button } from 'ui'
import { TimestampInfo } from 'ui-patterns'

export interface AuthorizedAppRowProps {
  app: AuthorizedApp
  onSelectRevoke: () => void
}

export const AuthorizedAppRow = ({ app, onSelectRevoke }: AuthorizedAppRowProps) => {
  return (
    <Table.tr>
      <Table.td>
        <div
          className="w-[30px] h-[30px] rounded-full bg-no-repeat bg-cover bg-center border border-control flex items-center justify-center"
          style={{ backgroundImage: app.icon ? `url('${app.icon}')` : 'none' }}
        >
          {!!app.icon ? '' : `${app.name[0]}`}
        </div>
      </Table.td>
      <Table.td>{app.name}</Table.td>
      <Table.td>{app.created_by}</Table.td>
      <Table.td>
        <div className="flex items-center gap-x-2">
          <p className="font-mono truncate" title={app.app_id}>
            {app.app_id}
          </p>
          <CopyButton iconOnly type="default" text={app.app_id} className="px-1" />
        </div>
      </Table.td>
      <Table.td>
        <TimestampInfo
          utcTimestamp={app.authorized_at ?? ''}
          labelFormat="DD/MM/YYYY, HH:mm:ss"
          className="text-sm"
        />
      </Table.td>
      <Table.td align="right">
        <Button type="default" icon={<Trash />} className="px-1" onClick={() => onSelectRevoke()} />
      </Table.td>
    </Table.tr>
  )
}
