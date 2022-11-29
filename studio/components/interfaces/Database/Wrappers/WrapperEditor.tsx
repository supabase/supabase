import { FC, useState } from 'react'
import { Button, Checkbox, Form, Input, SidePanel } from 'ui'

import ActionBar from 'components/interfaces/TableGridEditor/SidePanelEditor/ActionBar'
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

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)

    console.log('values:', values)
    // const { error } = await meta.wrappers.create({
    //   schema,
    //   name: wrapper.name,
    //   version: wrapper.default_version,
    //   cascade: true,
    // })
    // if (error) {
    //   ui.setNotification({
    //     error,
    //     category: 'error',
    //     message: `Failed to toggle ${wrapper.name.toUpperCase()}: ${error.message}`,
    //   })
    // } else {
    //   ui.setNotification({
    //     category: 'success',
    //     message: `${wrapper.name.toUpperCase()} is on.`,
    //   })
    // }

    setSubmitting(false)
    onCancel()
  }

  const initialValues = Object.fromEntries(
    wrapper.server.options.map((option) => [option.name, option.defaultValue ?? ''])
  )

  const [newTables, setNewTables] = useState<any[]>([])

  const [isAddTableOpen, setIsAddTableOpen] = useState(false)

  const onTableAdd = (values: any) => {
    setNewTables((prev) => [...prev, values])
    setIsAddTableOpen(false)
  }

  const onSaveChanges = console.log

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
        <Form initialValues={initialValues} validate={validate} onSubmit={onSubmit}>
          {({ isSubmitting, values }: any) => {
            return (
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
            )
          }}
        </Form>
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
