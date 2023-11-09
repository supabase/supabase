import Table from 'components/to-be-cleaned/Table'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import dayjs from 'dayjs'
import { copyToClipboard } from 'lib/helpers'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconCheck,
  IconClipboard,
  IconEdit,
  IconMoreVertical,
  IconTrash,
} from 'ui'

export interface OAuthAppRowProps {
  app: OAuthApp
  onSelectEdit: () => void
  onSelectDelete: () => void
}

const OAuthAppRow = ({ app, onSelectEdit, onSelectDelete }: OAuthAppRowProps) => {
  const [isCopied, setIsCopied] = useState(false)

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
      <Table.td>
        <p title={app.name} className="truncate">
          {app.name}
        </p>
      </Table.td>
      <Table.td>
        <div className="flex items-center">
          <p className="font-mono truncate w-[220px]" title={app.client_id}>
            {app.client_id}
          </p>
          <Button
            type="default"
            icon={
              isCopied ? <IconCheck className="text-brand" strokeWidth={3} /> : <IconClipboard />
            }
            className="ml-2 px-1"
            onClick={() => {
              copyToClipboard(app.client_id)
              setIsCopied(true)
              setTimeout(() => {
                setIsCopied(false)
              }, 3000)
            }}
          />
        </div>
      </Table.td>
      <Table.td>
        <span className="font-mono" title={app.client_secret_alias}>
          {app.client_secret_alias}...
        </span>
      </Table.td>
      <Table.td>{dayjs(app.created_at).format('DD/MM/YYYY, HH:mm:ss')}</Table.td>
      <Table.td align="right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<IconMoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem className="space-x-2" key="edit" onClick={() => onSelectEdit()}>
              <IconEdit />
              <p>Edit app</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="space-x-2" key="delete" onClick={() => onSelectDelete()}>
              <IconTrash />
              <p>Delete app</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}

export default OAuthAppRow
