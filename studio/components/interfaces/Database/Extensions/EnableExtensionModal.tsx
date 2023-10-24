import type { PostgresExtension } from '@supabase/postgres-meta'
import { useEffect, useState } from 'react'
import { Button, Form, IconDatabase, IconPlus, Input, Listbox, Modal } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useStore } from 'hooks'

interface EnableExtensionModalProps {
  visible: boolean
  extension: PostgresExtension
  onCancel: () => void
}

const EnableExtensionModal = ({ visible, extension, onCancel }: EnableExtensionModalProps) => {
  const { project } = useProjectContext()
  const { ui, meta } = useStore()
  const [defaultSchema, setDefaultSchema] = useState()
  const [fetchingSchemaInfo, setFetchingSchemaInfo] = useState(false)

  const { data: schemas, isLoading: isSchemasLoading } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // [Joshen] Worth checking in with users - whether having this schema selection
  // might be confusing, and if we should have a tooltip to explain that schemas
  // are just concepts of namespace, you can use that extension no matter where it's
  // installed in

  useEffect(() => {
    let cancel = false

    if (visible) {
      const checkExtensionSchema = async () => {
        if (!cancel) {
          setFetchingSchemaInfo(true)
          setDefaultSchema(undefined)
        }
        const res = await meta.query(
          `select * from pg_available_extension_versions where name = '${extension.name}'`
        )
        if (!res.error && !cancel) setDefaultSchema(res[0].schema)
        setFetchingSchemaInfo(false)
      }
      checkExtensionSchema()
    }

    return () => {
      cancel = true
    }
  }, [visible, extension.name])

  const validate = (values: any) => {
    const errors: any = {}
    if (values.schema === 'custom' && !values.name) errors.name = 'Required field'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)

    const schema =
      defaultSchema !== undefined && defaultSchema !== null
        ? defaultSchema
        : values.schema === 'custom'
        ? values.name
        : values.schema

    if (!schema.startsWith('pg_')) {
      const { error: createSchemaError } = await meta.query(`create schema if not exists ${schema}`)
      if (createSchemaError) {
        return ui.setNotification({
          error: createSchemaError,
          category: 'error',
          message: `Failed to create schema: ${createSchemaError.message}`,
        })
      }
    }

    const { error: createExtensionError } = await meta.extensions.create({
      schema,
      name: extension.name,
      version: extension.default_version,
      cascade: true,
    })
    if (createExtensionError) {
      ui.setNotification({
        error: createExtensionError,
        category: 'error',
        message: `Failed to toggle ${extension.name.toUpperCase()}: ${
          createExtensionError.message
        }`,
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
        <div className="flex items-baseline gap-2">
          <h5 className="text-sm text-foreground">Confirm to enable</h5>
          <code className="text-xs">{extension.name}</code>
        </div>
      }
    >
      <Form
        initialValues={{
          name: extension.name, // Name of new schema, if creating new
          schema: 'extensions',
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, values }: any) => {
          return (
            <div className="space-y-4 py-4">
              <Modal.Content>
                {fetchingSchemaInfo || isSchemasLoading ? (
                  <div className="space-y-2">
                    <ShimmeringLoader />
                    <div className="w-3/4">
                      <ShimmeringLoader />
                    </div>
                  </div>
                ) : defaultSchema ? (
                  <Input
                    disabled
                    id="schema"
                    name="schema"
                    value={defaultSchema}
                    label="Select a schema to enable the extension for"
                    descriptionText={`Extension must be installed in ${defaultSchema}.`}
                  />
                ) : (
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
                    <Modal.Separator />
                    {schemas?.map((schema) => {
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
                )}
              </Modal.Content>

              {values.schema === 'custom' && (
                <Modal.Content>
                  <Input id="name" name="name" label="Schema name" />
                </Modal.Content>
              )}

              <Modal.Separator />
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
