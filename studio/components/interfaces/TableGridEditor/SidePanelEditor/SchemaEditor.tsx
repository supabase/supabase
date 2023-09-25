import { useEffect, useState } from 'react'
import { Input, SidePanel } from 'ui'
import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import ActionBar from './ActionBar'

interface SchemaEditorProps {
  visible: boolean
  closePanel: () => void
  saveChanges: (resolve: any) => void
}

const SchemaEditor = ({ visible, closePanel, saveChanges }: SchemaEditorProps) => {
  const { project } = useProjectContext()

  const [errors, setErrors] = useState<{ name?: string }>({ name: undefined })
  const [name, setName] = useState('')

  const { mutate: createSchema } = useSchemaCreateMutation()

  useEffect(() => {
    if (visible) {
      setName('')
      setErrors({ name: undefined })
    }
  }, [visible])

  const onSaveChanges = (resolve: any) => {
    const errors: any = {}
    if (name.length === 0) errors.name = 'Please provide a name for your schema'
    if (Object.keys(errors).length > 0) {
      resolve()
      return setErrors(errors)
    }

    if (project === undefined) return console.error('Project is required')
    createSchema(
      { projectRef: project.ref, connectionString: project.connectionString, name },
      {
        onSuccess: () => {
          resolve()
          closePanel()
          toast.success(`Successfully created schema "${name}"`)
        },
      }
    )
  }

  return (
    <SidePanel
      size="large"
      key="SchemaEditor"
      visible={visible}
      header={'Create a new schema'}
      className="transition-all duration-100 ease-in"
      onCancel={closePanel}
      onConfirm={() => (resolve: () => void) => onSaveChanges(resolve)}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
    >
      <>
        <SidePanel.Content>
          <div className="space-y-10 py-6">
            <Input
              label="Name"
              layout="horizontal"
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
