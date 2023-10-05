import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, IconPlus, IconTrash, Input, SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEnumeratedTypeCreateMutation } from 'data/enumerated-types/enumerated-type-create-mutation'
import { uuidv4 } from 'lib/helpers'

interface CreateEnumeratedTypeSidePanelProps {
  visible: boolean
  onClose: () => void
}

const CreateEnumeratedTypeSidePanel = ({
  visible,
  onClose,
}: CreateEnumeratedTypeSidePanelProps) => {
  // [Joshen] Opting states for simplicity
  const [name, setName] = useState('')
  const [values, setValues] = useState([{ id: uuidv4(), value: '' }])

  const { project } = useProjectContext()
  const { mutate: createEnumeratedType, isLoading: isCreating } = useEnumeratedTypeCreateMutation({
    onSuccess: () => {
      toast.success(`Successfully created type "${name}"`)
      onClose()
    },
  })

  const updateValue = (id: string, value: string) => {
    const updatedValues = values.map((x) => {
      if (id === x.id) return { ...x, value }
      return x
    })
    setValues(updatedValues)
  }

  const saveEnumeratedType = () => {
    if (project?.ref === undefined) return console.error('Project ref required')
    if (project?.connectionString === undefined)
      return console.error('Project connectionString required')

    createEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      name,
      values: values.map((x) => x.value),
    })
  }

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={onClose}
      header="Create a new enumerated type"
      onConfirm={() => saveEnumeratedType()}
    >
      <SidePanel.Content className="py-4 space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="">
          <p className="text-sm text-foreground-light">Values</p>
          <div className="mt-2 mb-3 space-y-2">
            {values.map((x) => (
              <div key={x.id} className="flex items-center space-x-2">
                <Input
                  className="w-full"
                  value={x.value}
                  onChange={(e) => updateValue(x.id, e.target.value)}
                />
                <div>
                  <Button
                    type="default"
                    size="small"
                    icon={<IconTrash strokeWidth={1.5} size={16} />}
                    className="px-2"
                    onClick={() => setValues(values.filter((y) => y.id !== x.id))}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="default"
            icon={<IconPlus strokeWidth={1.5} />}
            onClick={() => setValues(values.concat([{ id: uuidv4(), value: '' }]))}
          >
            Add value
          </Button>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CreateEnumeratedTypeSidePanel
