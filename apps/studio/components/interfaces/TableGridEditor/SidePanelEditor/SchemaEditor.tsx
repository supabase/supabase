import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input, SidePanel } from 'ui'

import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

interface SchemaEditorProps {
  visible: boolean
  onSuccess: (schema: string) => void
  closePanel: () => void
}

const SchemaEditor = ({ visible, onSuccess, closePanel }: SchemaEditorProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [errors, setErrors] = useState<{ name?: string }>({ name: undefined })
  const [name, setName] = useState('')

  const { mutateAsync: createSchema, isLoading } = useSchemaCreateMutation()

  useEffect(() => {
    if (visible) {
      setName('')
      setErrors({ name: undefined })
    }
  }, [visible])

  const onSaveChanges = async () => {
    const errors: any = {}
    if (name.length === 0) errors.name = 'Please provide a name for your schema'
    if (Object.keys(errors).length > 0) {
      return setErrors(errors)
    }

    if (project === undefined) return console.error('Project is required')
    try {
      await createSchema({
        projectRef: project.ref,
        connectionString: project.connectionString,
        name,
      })
      onSuccess(name)
      toast.success(`Successfully created schema "${name}"`)
    } catch (error) {
      toast.error(`Failed to create schema: ${error}`)
    }
  }

  return (
    <SidePanel
      size="medium"
      key="SchemaEditor"
      visible={visible}
      header={'Create a new schema'}
      className="transition-all duration-100 ease-in"
      onCancel={closePanel}
      onConfirm={onSaveChanges}
      loading={isLoading}
      cancelText="Cancel"
      confirmText="Save"
    >
      <>
        <SidePanel.Content>
          <div className="space-y-10 py-6">
            <Input
              label="Schema name"
              layout="vertical"
              type="text"
              error={errors?.name}
              value={name}
              onChange={(event: any) => setName(event.target.value)}
            />
          </div>
        </SidePanel.Content>
      </>
    </SidePanel>
  )
}

export default SchemaEditor
