import Table from 'components/to-be-cleaned/Table'
import { ProjectSecret } from 'data/secrets/secrets-query'
import { useState } from 'react'
import { Button, IconEye, IconEyeOff, IconTrash, Input } from 'ui'

interface EdgeFunctionSecretProps {
  secret: ProjectSecret
  onSelectDelete: () => void
}

const EdgeFunctionSecret = ({ secret, onSelectDelete }: EdgeFunctionSecretProps) => {
  const [show, setShow] = useState(false)

  return (
    <Table.tr>
      <Table.td>
        <p className="truncate py-2 w-[250px]">{secret.name}</p>
      </Table.td>
      <Table.td>
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={
              show ? (
                <IconEyeOff size={16} strokeWidth={1.5} />
              ) : (
                <IconEye size={16} strokeWidth={1.5} />
              )
            }
            className="px-1"
            onClick={() => setShow(!show)}
          />
          {show ? (
            <Input copy value={secret.value} size="small" className="font-mono w-full" />
          ) : (
            <p className="text-sm font-mono">••••••••••••••••••</p>
          )}
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
