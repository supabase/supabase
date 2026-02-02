import type { PostgresExtension } from '@supabase/postgres-meta'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useIsOrioleDb, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { Database, ExternalLinkIcon, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  Input,
  Listbox,
  Modal,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

const orioleExtCallOuts = ['vector', 'postgis']

// Extensions that have recommended schemas (rather than required schemas)
const extensionsWithRecommendedSchemas: Record<string, string> = {
  wrappers: 'extensions',
}

interface EnableExtensionModalProps {
  visible: boolean
  extension: PostgresExtension
  onCancel: () => void
}

const EnableExtensionModal = ({ visible, extension, onCancel }: EnableExtensionModalProps) => {
  const { data: project } = useSelectedProjectQuery()
  const isOrioleDb = useIsOrioleDb()
  const [defaultSchema, setDefaultSchema] = useState()
  const [fetchingSchemaInfo, setFetchingSchemaInfo] = useState(false)

  const { data: schemas, isPending: isSchemasLoading } = useSchemasQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: visible }
  )
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })
  const { mutate: enableExtension, isPending: isEnabling } = useDatabaseExtensionEnableMutation({
    onSuccess: () => {
      toast.success(`Extension "${extension.name}" is now enabled`)
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
        try {
          const res = await executeSql({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            sql: `select * from pg_available_extension_versions where name = '${extension.name}'`,
          })
          if (!cancel) setDefaultSchema(res.result[0].schema)
        } catch (error) {}

        setFetchingSchemaInfo(false)
      }
      checkExtensionSchema()
    }

    return () => {
      cancel = true
    }
  }, [visible, extension.name])

  const getSchemaDescriptionText = (extensionName: string, schema: string | null | undefined) => {
    // Prioritize defaultSchema (required/forced) over recommended schema
    if (schema) {
      return `Extension must be installed in the “${schema}” schema.`
    }

    const recommendedSchema = extensionsWithRecommendedSchemas[extensionName]
    if (recommendedSchema) {
      return `Use the “${recommendedSchema}” schema for full compatibility with related features.`
    }

    return undefined
  }

  const isLoading = fetchingSchemaInfo || isSchemasLoading

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
          <h5 className="text-foreground">Enable</h5>
          <code className="text-code-inline">{extension.name}</code>
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
            <>
              <Modal.Content className="flex flex-col gap-y-2">
                {isOrioleDb && orioleExtCallOuts.includes(extension.name) && (
                  <Admonition type="default" title="Extension is limited by OrioleDB">
                    <span className="block">
                      {extension.name} cannot be accelerated by indexes on tables that are using the
                      OrioleDB access method
                    </span>
                    <DocsButton abbrev={false} className="mt-2" href={`${DOCS_URL}`} />
                  </Admonition>
                )}

                {isLoading ? (
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
                    descriptionText={getSchemaDescriptionText(extension.name, defaultSchema)}
                  />
                ) : (
                  <Listbox
                    size="small"
                    name="schema"
                    label="Select a schema to enable the extension for"
                    descriptionText={getSchemaDescriptionText(extension.name, null)}
                  >
                    <Listbox.Option
                      key="custom"
                      id="custom"
                      label={`Create a new schema "${extension.name}"`}
                      value="custom"
                      addOnBefore={() => <Plus size={16} strokeWidth={1.5} />}
                    >
                      Create a new schema "{extension.name}"
                    </Listbox.Option>
                    <Modal.Separator />
                    {schemas
                      ?.filter(
                        (schema) =>
                          !protectedSchemas.some(
                            (protectedSchema) => protectedSchema.name === schema.name
                          )
                      )
                      .map((schema) => {
                        return (
                          <Listbox.Option
                            key={schema.id}
                            id={schema.name}
                            label={schema.name}
                            value={schema.name}
                            addOnBefore={() => <Database size={16} strokeWidth={1.5} />}
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
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      The pg_cron extension is not fully supported for Fly projects
                    </AlertTitle_Shadcn_>

                    <AlertDescription_Shadcn_>
                      You can still enable the extension, but pg_cron jobs may not run due to the
                      behavior of Fly projects.
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
              <Modal.Content className="flex items-center justify-end space-x-2">
                <Button type="default" disabled={isEnabling} onClick={() => onCancel()}>
                  Cancel
                </Button>
                <Button htmlType="submit" disabled={isEnabling || isLoading} loading={isEnabling}>
                  Enable extension
                </Button>
              </Modal.Content>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default EnableExtensionModal
