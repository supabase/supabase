import { useState } from 'react'
import { Button, Input, SidePanel } from 'ui'

import ActionBar from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useStore } from 'hooks'
import { Wrapper } from './types'
import WrapperTableEditor from './WrapperTableEditor'

export type WrapperEditorProps = {
  visible: boolean
  wrapper: Wrapper
  onCancel: () => void
}

const WrapperEditor = ({ visible, wrapper, onCancel }: WrapperEditorProps) => {
  const { ui } = useStore()

  const validate = (values: any) => {
    const errors: any = {}
    if (values.schema === 'custom' && !values.name) errors.name = 'Required field'
    return errors
  }

  const getInitialFormState = () =>
    Object.fromEntries(
      wrapper.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    )

  const [formState, setFormState] = useState(getInitialFormState)
  const [newTables, setNewTables] = useState<any[]>([])

  const [isAddTableOpen, setIsAddTableOpen] = useState(false)

  const onTableAdd = (values: any) => {
    setNewTables((prev) => [...prev, values])
    setIsAddTableOpen(false)
  }

  const { project } = useProjectContext()
  const { mutateAsync: createFDW } = useFDWCreateMutation()

  const onSaveChanges = async (done: () => void) => {
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

      // Reset state
      setFormState(getInitialFormState())
      setNewTables([])

      ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Created foreign data wrapper successfully!`,
      })
    } catch (error: any) {
      ui.setNotification({
        id: toastId,
        category: 'error',
        message: error.message,
      })
    }

    done()
    onCancel()
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
        className={`transition-all duration-100 ease-in`}
        onCancel={onCancel}
        onConfirm={() => (resolve: () => void) => onSaveChanges(resolve)}
        customFooter={
          <ActionBar
            backButtonLabel="Cancel"
            applyButtonLabel="Save"
            closePanel={onCancel}
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
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, [option.name]: e.target.value }))
                  }
                />
              ))}

              {newTables.map((table, i) => (
                <div key={i}>{table.table_name}</div>
              ))}

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
        onCancel={() => setIsAddTableOpen(false)}
        onSave={onTableAdd}
      />
    </>
  )
}

export default WrapperEditor
