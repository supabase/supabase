import { useStore } from 'hooks'
import { FC, useState, useEffect } from 'react'
import { Input, Listbox, Modal, IconPlus } from 'ui'

interface Props {
  id?: string
  labelOptional?: string
  onSelectKey?: (key: any) => void
  onChangeKeyName?: (key: string) => void
}

const EncryptionKeySelector: FC<Props> = ({
  id,
  labelOptional,
  onSelectKey = () => {},
  onChangeKeyName = () => {},
}) => {
  const { vault } = useStore()
  const [showNewKeyField, setShowNewKeyField] = useState(false)

  const keys = vault.listKeys()

  useEffect(() => {
    console.log('Fetch all avaiable encryption keys from vault')
  }, [])

  const onChange = (id: any) => {
    if (id === 'create-new') {
      setShowNewKeyField(true)
    } else {
      setShowNewKeyField(false)
      const key = keys.find((key) => key.id === id)
      onSelectKey(key)
    }
  }

  return (
    <>
      <Listbox
        id={id}
        label="Encryption Key"
        size="small"
        defaultValue={keys[0].id}
        labelOptional={labelOptional}
        onChange={onChange}
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
          <Listbox.Option key={key.id} label={key.id} value={key.id}>
            <div className="space-y-1">
              <p>
                <span className="font-mono">{key.id}</span>
              </p>
              <p>{key.comment ?? 'Unnamed key'}</p>
            </div>
          </Listbox.Option>
        ))}
      </Listbox>
      {showNewKeyField && (
        <Input
          id="newKeyDescription"
          label="Description"
          labelOptional="Optional"
          onChange={(e) => onChangeKeyName(e.target.value)}
        />
      )}
    </>
  )
}

export default EncryptionKeySelector
