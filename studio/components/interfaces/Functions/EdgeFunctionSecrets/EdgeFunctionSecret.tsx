import Table from 'components/to-be-cleaned/Table'
import { ProjectSecret } from 'data/secrets/secrets-query'
import { Button, IconTrash } from 'ui'

interface EdgeFunctionSecretProps {
  secret: ProjectSecret
  onSelectDelete: () => void
}

const EdgeFunctionSecret = ({ secret, onSelectDelete }: EdgeFunctionSecretProps) => {
  return (
    <Table.tr>
      <Table.td>
        <p className="truncate py-2">{secret.name}</p>
      </Table.td>
      <Table.td>
        <div className="flex items-center space-x-2">
          <p className="font-mono text-sm truncate" title={secret.value}>
            {secret.value}
          </p>
        </div>
      </Table.td>
      <Table.td>
        <div className="flex items-center justify-end">
          <Button
            type="text"
            icon={<IconTrash />}
            className="px-1"
            onClick={() => onSelectDelete()}
          />
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default EdgeFunctionSecret
