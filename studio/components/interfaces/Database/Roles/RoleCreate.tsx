import { useState } from 'react'
import type { FC } from 'react'

import { observer } from 'mobx-react-lite'

import { Input, SidePanel, Toggle } from 'ui'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import { useStore } from 'hooks'

interface Props {
  visible: boolean
  onClose: () => void
}

interface RoleCreateFields {
  name: string
  api_access: boolean
}

const RoleCreate: FC<Props> = ({ visible, onClose }: Props) => {
  // Loading state when calling Roles API
  const [isCreatingRole, setIsCreatingRole] = useState<boolean>()
  // Form fields
  const [fields, setFields] = useState<RoleCreateFields>({ name: '', api_access: false })

  const { meta } = useStore()

  const onUpdateField = (update: Partial<RoleCreateFields>) => {
    setFields({ ...fields, ...update })
  }

  const tryCreateRole = async () => {
    setIsCreatingRole(true)
    const payload = { name: fields.name, members: '' }
    if (fields.api_access) {
      payload.members = 'authenticator'
    }
    await meta.roles
      .create(payload)
      .then((r) => {
        if (r.error) throw r.error
        onClose()
      })
      // TODO: handle error logic
      .catch(() => false)
      .finally(() => setIsCreatingRole(false))
  }

  return (
    <SidePanel
      key="RoleCreator"
      visible={visible}
      loading={isCreatingRole}
      onCancel={onClose}
      onConfirm={tryCreateRole}
    >
      <FormSection header={<FormSectionLabel className="lg:!col-span-4">General</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input
            label="Name of the role"
            type="text"
            placeholder="postgres"
            value={fields.name}
            onChange={(event) => {
              onUpdateField({ name: event.target.value })
            }}
          />
          <Toggle
            label="Allow access to API?"
            checked={fields.api_access}
            onChange={() => {
              onUpdateField({ api_access: !fields.api_access })
            }}
          />
          <small>
            If access allowed, then you will be able to use this role when calling API, like REST
            for example
          </small>
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}

export default observer(RoleCreate)
