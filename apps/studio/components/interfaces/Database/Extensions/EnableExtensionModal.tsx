import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgresExtension } from '@supabase/postgres-meta'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useIsOrioleDb, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { extensionsWithRecommendedSchemas } from './Extensions.constants'
import { useDatabaseExtensionDefaultSchemaQuery } from '@/data/database-extensions/database-extension-schema-query'

const orioleExtCallOuts = ['vector', 'postgis']

const FormSchema = z.object({ name: z.string(), schema: z.string() }).superRefine((val, ctx) => {
  if (val.schema === 'custom' && val.name.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['name'],
      message: 'Please provide a name for the schema',
    })
  }
})

interface EnableExtensionModalProps {
  visible: boolean
  extension: PostgresExtension
  onCancel: () => void
}

export const EnableExtensionModal = ({
  visible,
  extension,
  onCancel,
}: EnableExtensionModalProps) => {
  const isOrioleDb = useIsOrioleDb()
  const { data: project } = useSelectedProjectQuery()
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })

  const recommendedSchema = extensionsWithRecommendedSchemas[extension.name]

  const { data: schemas = [], isPending: isSchemasLoading } = useSchemasQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: visible }
  )
  const availableSchemas = schemas.filter(
    (schema) =>
      schema.name === recommendedSchema ||
      !protectedSchemas.some((protectedSchema) => protectedSchema.name === schema.name)
  )

  const { data: extensionMeta, isPending: fetchingSchemaInfo } =
    useDatabaseExtensionDefaultSchemaQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        extension: extension.name,
      },
      { enabled: visible }
    )
  // [Joshen] Hard-coding pg_cron here as this is enforced on our end (Not via pg_available_extension_versions)
  const defaultSchema = extension.name === 'pg_cron' ? 'pg_catalog' : extensionMeta?.schema

  const isLoading = fetchingSchemaInfo || isSchemasLoading

  const { mutate: enableExtension, isPending: isEnabling } = useDatabaseExtensionEnableMutation({
    onSuccess: () => {
      toast.success(`Extension "${extension.name}" is now enabled`)
      onCancel()
    },
    onError: (error) => {
      toast.error(`Failed to enable ${extension.name}: ${error.message}`)
    },
  })

  const defaultValues = { name: extension.name, schema: recommendedSchema ?? 'extensions' }
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })
  const { schema } = form.watch()

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
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
    <Dialog
      open={visible}
      onOpenChange={(open: boolean) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Enable {extension.name}</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        {isOrioleDb && orioleExtCallOuts.includes(extension.name) && (
          <Admonition
            type="default"
            title="Extension is limited by OrioleDB"
            className="border-x-0 border-t-0 rounded-none"
          >
            <span className="block">
              {extension.name} cannot be accelerated by indexes on tables that are using the
              OrioleDB access method
            </span>
            <DocsButton abbrev={false} className="mt-2" href={`${DOCS_URL}`} />
          </Admonition>
        )}

        {extension.name === 'pg_cron' && project?.cloud_provider === 'FLY' && (
          <Admonition
            type="warning"
            title="The pg_cron extension is not fully supported for Fly projects"
            className="border-x-0 border-t-0 rounded-none"
          >
            <p>
              You can still enable the extension, but pg_cron jobs may not run due to the behavior
              of Fly projects.
            </p>
            <DocsButton
              className="mt-2"
              href={`${DOCS_URL}/guides/platform/fly-postgres#limitations`}
            />
          </Admonition>
        )}

        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form id="enable-extensions-form" onSubmit={form.handleSubmit(onSubmit)}>
              {isLoading ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <div className="w-3/4">
                    <ShimmeringLoader />
                  </div>
                </div>
              ) : !!defaultSchema ? (
                <div className="flex flex-col gap-y-2">
                  <FormItemLayout
                    isReactForm={false}
                    label="Select a schema to enable the extension for"
                  >
                    <Input_Shadcn_ disabled value={defaultSchema} />
                  </FormItemLayout>
                  <p className="text-sm text-foreground-light">
                    Extension must be installed in the “{defaultSchema}” schema.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-y-2">
                  <FormField_Shadcn_
                    key="schema"
                    name="schema"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="schema"
                        label="Select a schema to enable the extension for"
                      >
                        <FormControl_Shadcn_>
                          <Select_Shadcn_
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!!defaultSchema}
                          >
                            <SelectTrigger_Shadcn_>
                              <SelectValue_Shadcn_ placeholder="Select a schema" />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectItem_Shadcn_ value="custom">
                                Create a new schema{' '}
                                <code className="text-code-inline">{extension.name}</code>
                              </SelectItem_Shadcn_>
                              <SelectSeparator_Shadcn_ />
                              {availableSchemas.map((schema) => {
                                return (
                                  <SelectItem_Shadcn_ key={schema.id} value={schema.name}>
                                    {schema.name}
                                    {schema.name === recommendedSchema ? (
                                      <Badge className="ml-2" variant="success">
                                        Recommended
                                      </Badge>
                                    ) : !defaultSchema && schema.name === 'extensions' ? (
                                      <Badge className="ml-2">Default</Badge>
                                    ) : null}
                                  </SelectItem_Shadcn_>
                                )
                              })}
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {!!recommendedSchema && (
                    <p className="text-sm text-foreground-light">
                      Use the "{recommendedSchema}" schema for full compatibility with related
                      features.
                    </p>
                  )}

                  {schema === 'custom' && (
                    <FormField_Shadcn_
                      key="name"
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout name="name" label="Schema name">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_ {...field} />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  )}
                </div>
              )}
            </form>
          </Form_Shadcn_>
        </DialogSection>

        <DialogFooter>
          <Button type="default" disabled={isEnabling} onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button
            htmlType="submit"
            form="enable-extensions-form"
            loading={isEnabling}
            disabled={isLoading || isEnabling}
          >
            Enable extension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
