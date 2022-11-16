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
  const [showNewKeyField, setShowNewKeyField] = useState(false)

  useEffect(() => {
    console.log('Fetch all avaiable encryption keys from vault')
  }, [])

  const mockKeys = [
    { id: 1, name: 'profile_full_name_key' },
    { id: 2, name: 'user_email_key' },
    { id: 3, name: 'customer_address_key' },
  ]

  const onChange = (id: any) => {
    if (id === 'create-new') {
      setShowNewKeyField(true)
    } else {
      setShowNewKeyField(false)
      const key = mockKeys.find((key) => key.id === id)
      onSelectKey(key)
    }
  }

  return (
    <>
      <Listbox
        id={id}
        label="Encryption Key"
        size="small"
        defaultValue={mockKeys[0].id}
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
        {mockKeys.map((key) => (
          <Listbox.Option key={key.id} label={key.name} value={key.id}>
            {key.name}
          </Listbox.Option>
        ))}
      </Listbox>
      {showNewKeyField && (
        <Input
          id="newKeyName"
          label="Encryption Key Name"
          onChange={(e) => onChangeKeyName(e.target.value)}
        />
      )}
    </>
  )
}

export default EncryptionKeySelector
