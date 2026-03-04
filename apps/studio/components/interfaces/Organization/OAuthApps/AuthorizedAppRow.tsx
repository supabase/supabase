import { Trash } from 'lucide-react'

import CopyButton from 'components/ui/CopyButton'
import type { AuthorizedApp } from 'data/oauth/authorized-apps-query'
import { Button, TableCell, TableRow } from 'ui'
import { TimestampInfo } from 'ui-patterns'

export interface AuthorizedAppRowProps {
  app: AuthorizedApp
  onSelectRevoke: () => void
}

export const AuthorizedAppRow = ({ app, onSelectRevoke }: AuthorizedAppRowProps) => {
  return (
    <TableRow>
      <TableCell className="w-[30px]">
        <div
          className="w-[30px] h-[30px] rounded-full bg-no-repeat bg-cover bg-center border border-control flex items-center justify-center"
          style={{ backgroundImage: app.icon ? `url('${app.icon}')` : 'none' }}
        >
          {!!app.icon ? '' : `${app.name[0]}`}
        </div>
      </TableCell>
      <TableCell>{app.name}</TableCell>
      <TableCell>{app.created_by}</TableCell>
      <TableCell>
        <div className="flex items-center gap-x-2">
          <p className="font-mono truncate" title={app.app_id}>
            {app.app_id}
          </p>
          <CopyButton iconOnly type="default" text={app.app_id} className="px-1" />
        </div>
      </TableCell>
      <TableCell>
        <TimestampInfo
          utcTimestamp={app.authorized_at ?? ''}
          labelFormat="DD/MM/YYYY, HH:mm:ss"
          className="text-sm"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button type="default" icon={<Trash />} className="px-1" onClick={() => onSelectRevoke()} />
      </TableCell>
    </TableRow>
  )
}
