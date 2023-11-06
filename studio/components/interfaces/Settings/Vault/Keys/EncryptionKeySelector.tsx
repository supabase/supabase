import { noop } from 'lodash'
import { IconPlus, Input, Listbox, Modal } from 'ui'

import { useStore } from 'hooks'

interface EncryptionKeySelectorProps {
  id?: string
  nameId?: string
  label?: string
  labelOptional?: string
  selectedKeyId?: any
  error?: string
  onSelectKey: (keyId: string) => void
  onUpdateDescription?: (desc: string) => void
}

const EncryptionKeySelector = ({
  id = 'keyId',
  nameId = 'keyName',
  label = 'Encryption key',
  labelOptional,
  selectedKeyId,
  error,
  onSelectKey = noop,
  onUpdateDescription = noop,
}: EncryptionKeySelectorProps) => {
  const { vault } = useStore()
  const keys = vault.listKeys()

  return (
    <>
      <Listbox
        id={id}
        label={label}
        size="small"
        defaultValue={selectedKeyId}
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
        {keys.length > 0 && <Modal.Separator />}
        {keys.map((key) => (
          <Listbox.Option key={key.id} label={key.name} value={key.id}>
            <div className="space-y-1">
              <p>{key.name || 'No name provided'}</p>
              <p className="text-xs">
                ID: <span className="font-mono">{key.id}</span>
              </p>
            </div>
          </Listbox.Option>
        ))}
      </Listbox>
      {selectedKeyId === 'create-new' && (
        <Input
          id={nameId}
          label="Name of encryption key"
          error={error}
          onChange={(event) => onUpdateDescription(event.target.value)}
          descriptionText="Provide a name for your key for easier identification"
        />
      )}
    </>
  )
}

export default EncryptionKeySelector
