import { FC } from 'react'
import { Input, Listbox, Modal, IconPlus } from 'ui'
import { useStore } from 'hooks'

interface Props {
  id?: string
  descriptionId?: string
  label?: string
  labelOptional?: string
  selectedKeyId?: any
  onSelectKey: (keyId: string) => void
  onUpdateDescription?: (desc: string) => void
}

const EncryptionKeySelector: FC<Props> = ({
  id = 'keyId',
  descriptionId = 'keyDescription',
  label = 'Encryption key',
  labelOptional,
  selectedKeyId,
  onSelectKey = () => {},
  onUpdateDescription = () => {},
}) => {
  const { vault } = useStore()
  const keys = vault.listKeys()

  return (
    <>
      <Listbox
        id={id}
        label={label}
        size="small"
        value={selectedKeyId}
        labelOptional={labelOptional}
        onChange={onSelectKey}
      >
        <Listbox.Option
          key="create-new"
          id="create-new"
          value="create-new"
          label="Create a new Encryption Key"
          addOnBefore={() => <IconPlus size={16} strokeWidth={1.5} />}
        >
          Create a new Encryption Key
        </Listbox.Option>
        <Modal.Separator />
        {keys.map((key) => (
          <Listbox.Option
            key={key.id}
            label={key.status === 'default' ? `${key.id} (Default)` : key.id}
            value={key.id}
          >
            <div className="space-y-1">
              <p>{key.comment || 'No description provided'}</p>
              <p className="text-xs">
                ID: <span className="font-mono">{key.id}</span>
              </p>
            </div>
          </Listbox.Option>
        ))}
      </Listbox>
      {selectedKeyId === 'create-new' && (
        <Input
          id={descriptionId}
          label="Description"
          labelOptional="Optional"
          onChange={(event) => onUpdateDescription(event.target.value)}
        />
      )}
    </>
  )
}

export default EncryptionKeySelector
