import Table from 'components/to-be-cleaned/Table'
import { AuthorizedApp } from 'data/oauth/authorized-apps-query'
import dayjs from 'dayjs'
import { Button, IconTrash } from 'ui'

export interface AuthorizedAppRowProps {
  app: AuthorizedApp
  onSelectRevoke: () => void
}

const AuthorizedAppRow = ({ app, onSelectRevoke }: AuthorizedAppRowProps) => {
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
      <Table.td>{app.name}</Table.td>
      <Table.td>{dayjs(app.authorized_at).format('DD/MM/YYYY, HH:mm:ss')}</Table.td>
      <Table.td align="right">
        <Button
          type="default"
          icon={<IconTrash />}
          className="px-1"
          onClick={() => onSelectRevoke()}
        />
      </Table.td>
    </Table.tr>
  )
}

export default AuthorizedAppRow
