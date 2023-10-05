import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconPlus,
  IconTrash,
  Input,
  SidePanel,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEnumeratedTypeCreateMutation } from 'data/enumerated-types/enumerated-type-create-mutation'
import { uuidv4 } from 'lib/helpers'
import { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { useEnumeratedTypeUpdateMutation } from 'data/enumerated-types/enumerated-type-update-mutation'

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
  const [values, setValues] = useState<{ id: string; value: string }[]>([])

  const originalEnumeratedTypes = (selectedEnumeratedType?.enums ?? []).map((x) => ({
    id: x,
    value: x,
  }))

  useEffect(() => {
    if (selectedEnumeratedType !== undefined) {
      setName(selectedEnumeratedType.name)
      setValues(originalEnumeratedTypes)
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
      if (id === x.id) return { ...x, value }
      return x
    })
    setValues(updatedValues)
  }

  const saveEnumeratedType = () => {
    if (project?.ref === undefined) return console.error('Project ref required')
    if (project?.connectionString === undefined)
      return console.error('Project connectionString required')
    if (selectedEnumeratedType === undefined)
      return console.error('selectedEnumeratedType required')

    const newValues = values.filter((x) => !selectedEnumeratedType.enums.includes(x.value))

    updateEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      originalName: selectedEnumeratedType.name,
      name,
      values: newValues.map((x) => x.value),
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

        <div className="">
          <p className="text-sm text-foreground-light mb-1">Values</p>

          <Alert_Shadcn_>
            <IconAlertCircle strokeWidth={1.5} />
            <AlertTitle_Shadcn_>Existing values in an enum cannot be altered</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              You may only add new values to an existing enumerated type. If you'd like to update or
              delete existing values, you will need to delete and recreate the enumerated type with
              the updated values.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>

          <div className="mt-2 mb-3 space-y-2">
            {values.map((x) => {
              const disabled = x.id === x.value

              return (
                <div key={x.id} className="flex items-center space-x-2">
                  <Input
                    className="w-full"
                    value={x.value}
                    disabled={disabled}
                    onChange={(e) => updateValue(x.id, e.target.value)}
                  />
                  <Button
                    type="default"
                    size="small"
                    icon={<IconTrash strokeWidth={1.5} size={16} />}
                    className="px-2"
                    disabled={disabled}
                    onClick={() => setValues(values.filter((y) => y.id !== x.id))}
                  />
                </div>
              )
            })}
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

export default EditEnumeratedTypeSidePanel
