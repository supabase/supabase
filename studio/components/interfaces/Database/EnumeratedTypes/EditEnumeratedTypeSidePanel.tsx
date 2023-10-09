import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconExternalLink,
  IconPlus,
  IconTrash,
  Input,
  SidePanel,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { uuidv4 } from 'lib/helpers'
import { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { useEnumeratedTypeUpdateMutation } from 'data/enumerated-types/enumerated-type-update-mutation'
import Link from 'next/link'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'

interface EditEnumeratedTypeSidePanelProps {
  visible: boolean
  selectedEnumeratedType?: EnumeratedType
  onClose: () => void
}

const EditEnumeratedTypeSidePanel = ({
  visible,
  selectedEnumeratedType,
  onClose,
}: EditEnumeratedTypeSidePanelProps) => {
  // [Joshen] Opting states for simplicity
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [values, setValues] = useState<
    { id: string; originalValue: string; updatedValue: string }[]
  >([])

  const originalEnumeratedTypes = (selectedEnumeratedType?.enums ?? []).map((x) => ({
    id: x,
    originalValue: x,
    updatedValue: x,
  }))

  useEffect(() => {
    if (selectedEnumeratedType !== undefined) {
      setName(selectedEnumeratedType.name)
      setValues(originalEnumeratedTypes)
      if (selectedEnumeratedType.comment) setDescription(selectedEnumeratedType.comment)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnumeratedType])

  const { project } = useProjectContext()
  const { mutate: updateEnumeratedType, isLoading: isCreating } = useEnumeratedTypeUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully updated type "${name}"`)
      onClose()
    },
  })

  const updateValue = (id: string, value: string) => {
    const updatedValues = values.map((x) => {
      if (id === x.id) return { ...x, updatedValue: value }
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
    if (selectedEnumeratedType === undefined)
      return console.error('selectedEnumeratedType required')

    const payload: {
      name: { original: string; updated: string }
      values: { original: string; updated: string; isNew: boolean }[]
      description?: string
    } = {
      name: { original: selectedEnumeratedType.name, updated: name },
      values: values
        .filter((x) => x.updatedValue.length !== 0)
        .map((x) => ({
          original: x.originalValue,
          updated: x.updatedValue,
          isNew: x.id !== x.originalValue,
        })),
      ...(description !== selectedEnumeratedType.comment ? { description } : {}),
    }

    updateEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      ...payload,
    })
  }

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={onClose}
      header={`Update type "${selectedEnumeratedType?.name}"`}
      onConfirm={() => saveEnumeratedType()}
    >
      <SidePanel.Content className="py-4 space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Description"
          placeholder="Optional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <label className="text-sm text-foreground-light mb-1">Values</label>

          <Alert_Shadcn_>
            <IconAlertCircle strokeWidth={1.5} />
            <AlertTitle_Shadcn_>Existing values cannot be deleted or sorted</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              You may only add or update values to an existing enumerated type. If you'd like to
              delete existing values, you will need to delete and recreate the enumerated type with
              the updated values.
              <Link
                passHref
                href="https://www.postgresql.org/message-id/21012.1459434338%40sss.pgh.pa.us"
              >
                <Button
                  asChild
                  type="default"
                  icon={<IconExternalLink strokeWidth={1.5} />}
                  className="mt-2"
                >
                  <a target="_blank" rel="noreferrer">
                    Learn more
                  </a>
                </Button>
              </Link>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>

          <DragDropContext onDragEnd={(result: any) => updateOrder(result)}>
            <Droppable droppableId="enum_type_values_droppable">
              {(droppableProvided: DroppableProvided) => (
                <div ref={droppableProvided.innerRef} className="mt-2 mb-3 space-y-2">
                  {values.map((x, idx) => (
                    <EnumeratedTypeValueRow
                      key={x.id}
                      index={idx}
                      isDisabled={x.id === x.originalValue}
                      enumTypeValue={{ id: x.id, value: x.updatedValue }}
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
            onClick={() =>
              setValues(values.concat([{ id: uuidv4(), originalValue: '', updatedValue: '' }]))
            }
          >
            Add value
          </Button>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default EditEnumeratedTypeSidePanel
