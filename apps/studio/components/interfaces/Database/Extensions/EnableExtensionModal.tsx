import type { PostgresExtension } from '@supabase/postgres-meta'
import { ExternalLinkIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useStore } from 'hooks'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  IconAlertTriangle,
  IconDatabase,
  IconPlus,
  Input,
  Listbox,
  Modal,
} from 'ui'

interface EnableExtensionModalProps {
  visible: boolean
  extension: PostgresExtension
  onCancel: () => void
}

const EnableExtensionModal = ({ visible, extension, onCancel }: EnableExtensionModalProps) => {
  const { project } = useProjectContext()
  const { meta } = useStore()
  const [defaultSchema, setDefaultSchema] = useState()
  const [fetchingSchemaInfo, setFetchingSchemaInfo] = useState(false)

  const { data: schemas, isLoading: isSchemasLoading } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutate: enableExtension, isLoading: isEnabling } = useDatabaseExtensionEnableMutation({
    onSuccess: () => {
      toast.success(`${extension.name} is on.`)
      onCancel()
    },
    onError: (error) => {
      toast.error(`Failed to enable ${extension.name}: ${error.message}`)
    },
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

  const onSubmit = async (values: any) => {
    if (project === undefined) return console.error('Project is required')

    const schema =
      defaultSchema !== undefined && defaultSchema !== null
        ? defaultSchema
        : values.schema === 'custom'
        ? values.name
        : values.schema

    enableExtension({
      projectRef: project.ref,
      connectionString: project?.connectionString,
      schema,
      name: extension.name,
      version: extension.default_version,
      cascade: true,
      createSchema: !schema.startsWith('pg_'),
    })
  }

  return (
    <Modal
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
        {({ values }: any) => {
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

              {extension.name === 'pg_cron' && project?.cloud_provider === 'FLY' && (
                <Modal.Content>
                  <Alert_Shadcn_ variant="warning">
                    <IconAlertTriangle strokeWidth={2} />
                    <AlertTitle_Shadcn_>
                      The pg_cron extension is not fully supported for Fly projects
                    </AlertTitle_Shadcn_>

                    <AlertDescription_Shadcn_>
                      You can still enable the extension, but pg_cron jobs may not run due to the
                      behaviour of Fly projects.
                    </AlertDescription_Shadcn_>

                    <AlertDescription_Shadcn_ className="mt-3">
                      <Button
                        asChild
                        type="default"
                        iconRight={<ExternalLinkIcon width={12} height={12} />}
                      >
                        <a
                          href="/docs/guides/platform/fly-postgres#limitations"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Learn more</span>
                        </a>
                      </Button>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </Modal.Content>
              )}

              <Modal.Separator />
              <Modal.Content>
                <div className="flex items-center justify-end space-x-2">
                  <Button type="default" disabled={isEnabling} onClick={() => onCancel()}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" disabled={isEnabling} loading={isEnabling}>
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
