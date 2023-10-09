import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import toast from 'react-hot-toast'
import { Button, IconPlus, Input, SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEnumeratedTypeCreateMutation } from 'data/enumerated-types/enumerated-type-create-mutation'
import { uuidv4 } from 'lib/helpers'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'

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
  const [description, setDescription] = useState('')
  const [values, setValues] = useState([{ id: uuidv4(), value: '' }])

  useEffect(() => {
    if (visible) {
      setName('')
      setDescription('')
      setValues([{ id: uuidv4(), value: '' }])
    }
  }, [visible])

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

  const updateOrder = (result: any) => {
    // Dropped outside of the list
    if (!result.destination) return

    const updatedValues = values.slice()
    const [removed] = updatedValues.splice(result.source.index, 1)
    updatedValues.splice(result.destination.index, 0, removed)
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
      description,
      values: values.filter((x) => x.value.length > 0).map((x) => x.value),
    })
  }

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={onClose}
      header="Create a new enumerated type"
      confirmText="Create type"
      onConfirm={() => saveEnumeratedType()}
    >
      <SidePanel.Content className="py-4 space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Description"
          labelOptional="Optional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <label className="text-sm text-foreground-light">Values</label>
          <DragDropContext onDragEnd={(result: any) => updateOrder(result)}>
            <Droppable droppableId="enum_type_values_droppable">
              {(droppableProvided: DroppableProvided) => (
                <div ref={droppableProvided.innerRef} className="mt-2 mb-3 space-y-2">
                  {values.map((x, idx) => (
                    <EnumeratedTypeValueRow
                      key={x.id}
                      index={idx}
                      enumTypeValue={x}
                      onUpdateValue={updateValue}
                      onRemoveValue={() => setValues(values.filter((y) => y.id !== x.id))}
                    />
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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
