import { isEmpty } from 'lodash'
import { useState } from 'react'
import { Button, IconDelete, IconEdit, IconTrash, IconTrash2, Input, SidePanel } from 'ui'

import ActionBar from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useStore } from 'hooks'
import { Wrapper } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'

// [Joshen TODO]  No longer used, can remove after WrapperRow is working

export type WrapperEditorProps = {
  visible: boolean
  wrapper: Wrapper
  onCancel: () => void
}

const WrapperEditor = ({ visible, wrapper, onCancel }: WrapperEditorProps) => {
  const { ui } = useStore()

  const validate = makeValidateRequired(wrapper.server.options)

  const getInitialFormState = () =>
    Object.fromEntries(
      wrapper.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    )

  const [formState, setFormState] = useState(getInitialFormState)
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})
  const [newTables, setNewTables] = useState<any[]>([])

  const [isAddTableOpen, setIsAddTableOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<any>(null)

  const onTableAdd = (values: any) => {
    setNewTables((prev) => {
      // if the new values have tableIndex, we are editing an existing table
      if (values.tableIndex !== undefined) {
        const tableIndex = values.tableIndex
        const newTables = [...prev]
        delete values.tableIndex
        newTables[tableIndex] = values
        return newTables
      }

      return [...prev, values]
    })
    setIsAddTableOpen(false)
    setEditingTable(null)
  }

  const resetForm = () => {
    setFormState(getInitialFormState())
    setNewTables([])
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  const { project } = useProjectContext()
  const { mutateAsync: createFDW } = useFDWCreateMutation()

  const onSaveChanges = async (done: () => void) => {
    // Validate form
    const errors = validate(formState)
    if (!isEmpty(errors)) {
      setFormErrors(errors)
      done()
      return
    }

    const toastId = ui.setNotification({
      category: 'loading',
      message: `Creating foreign data wrapper...`,
    })

    try {
      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapper,
        formState,
        newTables,
      })

      resetForm()

      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Created foreign data wrapper successfully!`,
      })

      onCancel()
    } catch (error: any) {
      ui.setNotification({
        id: toastId,
        category: 'error',
        message: error.message,
      })
    }

    done()
  }

  return (
    <>
      <SidePanel
        size="large"
        key="WrapperEditor"
        visible={visible}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-scale-1200">{wrapper.label} Foreign Data Wrapper</h5>
          </div>
        }
        className="transition-all duration-100 ease-in"
        onCancel={handleCancel}
        onConfirm={() => (resolve: () => void) => onSaveChanges(resolve)}
        customFooter={
          <ActionBar
            backButtonLabel="Cancel"
            applyButtonLabel="Save"
            closePanel={handleCancel}
            applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
          />
        }
        onInteractOutside={(event) => {
          const isToast = (event.target as Element)?.closest('#toast')
          if (isToast) {
            event.preventDefault()
          }
        }}
      >
        <div className="py-6">
          <SidePanel.Content>
            <div className="space-y-10">
              {wrapper.server.options.map((option) => (
                <Input
                  key={option.name}
                  id={option.name}
                  name={option.name}
                  label={option.label}
                  defaultValue={option.defaultValue ?? ''}
                  required={option.required ?? false}
                  layout="horizontal"
                  value={formState[option.name]}
                  onChange={(e) => {
                    setFormState((prev) => ({ ...prev, [option.name]: e.target.value }))
                    setFormErrors((prev) => ({ ...prev, [option.name]: '' }))
                  }}
                  error={formErrors[option.name]}
                  className="input-mono"
                />
              ))}

              {newTables.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="block text-sm break-all text-scale-1100">Tables</div>

                  {newTables.map((table, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 pl-4 pr-2 border rounded bg-scale-400 border-scale-600"
                    >
                      <div className="font-mono text-lg">{table.table_name}</div>

                      <div className="flex items-center gap-2">
                        <Button
                          icon={<IconEdit size="small" />}
                          size="tiny"
                          type="outline"
                          onClick={() => {
                            setEditingTable({ ...table, tableIndex: i })
                            setIsAddTableOpen(true)
                          }}
                        />
                        <Button
                          icon={<IconTrash2 size="small" />}
                          size="tiny"
                          type="outline"
                          onClick={() => {
                            setNewTables((prev) => prev.filter((_, j) => j !== i))
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button type="default" onClick={() => setIsAddTableOpen(true)}>
                Add table
              </Button>
            </div>
          </SidePanel.Content>
        </div>
      </SidePanel>

      <WrapperTableEditor
        visible={isAddTableOpen}
        tables={wrapper.tables}
        onCancel={() => {
          setEditingTable(null)
          setIsAddTableOpen(false)
        }}
        onSave={onTableAdd}
        initialData={editingTable}
      />
    </>
  )
}

export default WrapperEditor
