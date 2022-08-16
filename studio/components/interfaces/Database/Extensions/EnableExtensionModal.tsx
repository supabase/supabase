import { FC } from 'react'
import { Button, Input, Form, Modal, Listbox, IconPlus, IconDatabase } from '@supabase/ui'
import { PostgresExtension, PostgresSchema } from '@supabase/postgres-meta'

import { useStore } from 'hooks'

interface Props {
  visible: boolean
  extension: PostgresExtension
  onCancel: () => void
}

const EnableExtensionModal: FC<Props> = ({ visible, extension, onCancel }) => {
  const { ui, meta } = useStore()
  const schemas = meta.schemas.list()

  const validate = (values: any) => {
    const errors: any = {}
    if (values.schema === 'custom' && !values.name) errors.name = 'Required field'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    if (values.schema === 'custom') {
      const { error } = await meta.query(`create schema if not exists ${values.name}`)
      if (error) {
        return ui.setNotification({
          error,
          category: 'error',
          message: `Failed to create schema: ${error.message}`,
        })
      }
    }

    const { error } = await meta.extensions.create({
      name: extension.name,
      schema: values.schema === 'custom' ? values.name : values.schema,
      version: extension.default_version,
      cascade: true,
    })
    if (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to toggle ${extension.name.toUpperCase()}: ${error.message}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: `${extension.name.toUpperCase()} is on.`,
      })
    }

    setSubmitting(false)
    onCancel()
  }

  return (
    <Modal
      closable
      hideFooter
      visible={visible}
      onCancel={onCancel}
      size="small"
      header={
        <div className="flex gap-2 items-baseline">
          <h5 className="text-sm text-scale-1200">Confirm to enable</h5>
          <code className="text-xs">{extension.name}</code>
        </div>
      }
    >
      <Form
        initialValues={{
          name: extension.name, // Name of new schema, if creating new
          schema: 'custom',
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, values }: any) => {
          return (
            <div className="space-y-4 py-4">
              <Modal.Content>
                <Listbox
                  size="small"
                  name="schema"
                  label="Select a schema to enable the extension for"
                >
                  <Listbox.Option
                    key="custom"
                    id="custom"
                    label={`Create a new schema "${extension.name}"`}
                    value="custom"
                    addOnBefore={() => <IconPlus size={16} strokeWidth={1.5} />}
                  >
                    Create a new schema "{extension.name}"
                  </Listbox.Option>
                  <Modal.Seperator />
                  {/* @ts-ignore */}
                  {schemas.map((schema: PostgresSchema) => {
                    return (
                      <Listbox.Option
                        key={schema.id}
                        id={schema.name}
                        label={schema.name}
                        value={schema.name}
                        addOnBefore={() => <IconDatabase size={16} strokeWidth={1.5} />}
                      >
                        {schema.name}
                      </Listbox.Option>
                    )
                  })}
                </Listbox>
              </Modal.Content>

              {values.schema === 'custom' && (
                <Modal.Content>
                  <Input id="name" name="name" label="Schema name" />
                </Modal.Content>
              )}

              <Modal.Seperator />
              <Modal.Content>
                <div className="flex items-center justify-end space-x-2">
                  <Button type="default" disabled={isSubmitting} onClick={() => onCancel()}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" disabled={isSubmitting} loading={isSubmitting}>
                    Enable extension
                  </Button>
                </div>
              </Modal.Content>
            </div>
          )
        }}
      </Form>
    </Modal>
  )
}

export default EnableExtensionModal
