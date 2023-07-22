import Table from 'components/to-be-cleaned/Table'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import dayjs from 'dayjs'
import { copyToClipboard } from 'lib/helpers'
import { useState } from 'react'
import {
  Button,
  Dropdown,
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
          className="w-[30px] h-[30px] rounded-full bg-no-repeat bg-cover bg-center border border-scale-600 flex items-center justify-center"
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
              isCopied ? (
                <IconCheck className="text-brand-900" strokeWidth={3} />
              ) : (
                <IconClipboard />
              )
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
        <Dropdown
          size="tiny"
          align="end"
          side="bottom"
          overlay={[
            <Dropdown.Item key="edit" icon={<IconEdit />} onClick={() => onSelectEdit()}>
              Edit app
            </Dropdown.Item>,
            <Dropdown.Separator key="separator" />,
            <Dropdown.Item key="delete" icon={<IconTrash />} onClick={() => onSelectDelete()}>
              Delete app
            </Dropdown.Item>,
          ]}
        >
          <Button type="default" icon={<IconMoreVertical />} className="px-1" />
        </Dropdown>
      </Table.td>
    </Table.tr>
  )
}

export default OAuthAppRow
