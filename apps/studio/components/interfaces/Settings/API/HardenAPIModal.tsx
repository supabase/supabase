import { Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import InformationBox from 'components/ui/InformationBox'
import { useCreateAndExposeAPISchemaMutation } from 'data/api-settings/create-and-expose-api-schema-mutation'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  CodeBlock,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  WarningIcon,
} from 'ui'

interface HardenAPIModalProps {
  visible: boolean
  onClose: () => void
}

export const HardenAPIModal = ({ visible, onClose }: HardenAPIModalProps) => {
  const project = useSelectedProject()

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef: project?.ref })

  const hasAPISchema = (schemas ?? []).find((schema) => schema.name === 'api')
  const exposedSchemas = config?.db_schema.split(',').map((x) => x.trim()) ?? []
  const isAPISchemaExposed = exposedSchemas.includes('api')
  const isPublicSchemaExposed = exposedSchemas.includes('public')

  const { mutate: createAndExposeAPISchema, isLoading: isCreatingAPISchema } =
    useCreateAndExposeAPISchemaMutation({
      onSuccess: () => {
        toast.success(`Successfully created api schema and exposed via Data API`)
      },
    })

  const { mutate: updatePostgrestConfig, isLoading: isUpdatingConfig } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: () => {
        toast.success('Success removed public schema from exposed schemas')
      },
    })

  const onSelectCreateAndExposeAPISchema = () => {
    if (project === undefined) return console.error('Project is required')
    if (config === undefined) return console.error('Postgrest config is required')
    createAndExposeAPISchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      existingPostgrestConfig: {
        max_rows: config.max_rows,
        db_pool: config.db_pool,
        db_schema: config.db_schema,
        db_extra_search_path: config?.db_extra_search_path,
      },
    })
  }

  const onSelectRemovePublicSchema = () => {
    if (project === undefined) return console.error('Project is required')
    if (config === undefined) return console.error('Postgrest config is required')

    const updatedDbExtraSearchPath = config.db_extra_search_path
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== 'public')
      .join(', ')
    const updatedDbSchema = config.db_schema
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== 'public')
      .join(', ')
    updatePostgrestConfig({
      projectRef: project.ref,
      maxRows: config.max_rows,
      dbPool: config.db_pool,
      dbSchema: updatedDbSchema,
      dbExtraSearchPath: updatedDbExtraSearchPath,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Switch the default API schema</DialogTitle>
          <DialogDescription>
            Expose a custom schema instead of the{' '}
            <code className="text-xs text-foreground">public</code> schema
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm text-foreground-light">
          <p>
            By default, the <code className="text-xs text-foreground">public</code> schema is used
            to generate API routes. In some cases, it's better to use a custom schema. This is
            important if you use tools that generate tables in the{' '}
            <code className="text-xs text-foreground">public</code> schema to{' '}
            <span className="text-brand">prevent accidental exposure of data</span>.
          </p>
          <DocsButton
            abbrev={false}
            className="w-min mt-4"
            href="https://supabase.com/docs/guides/database/hardening-data-api"
          />
        </DialogSection>

        <DialogSectionSeparator />

        <Collapsible_Shadcn_>
          <CollapsibleTrigger_Shadcn_ className="py-4 px-5 w-full flex items-center justify-between text-sm">
            <p>
              1. Create a custom <code className="text-xs text-foreground">api</code> schema and
              expose it
            </p>
            {hasAPISchema && isAPISchemaExposed ? (
              <Check size={16} className="text-brand" />
            ) : (
              <ChevronDown
                size={16}
                className="transition data-open-parent:rotate-180 data-closed-parent:rotate-0"
              />
            )}
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light flex flex-col gap-y-4">
            <p className="mx-5">
              Click the button below to create a new schema named{' '}
              <code className="text-xs text-foreground">api</code> and grant the{' '}
              <code className="text-xs text-foreground">anon</code> and{' '}
              <code className="text-xs text-foreground">authenticated</code> roles usage privileges
              on this schema. This schema will thereafter also be exposed to the Data API.
            </p>

            <div className="px-5">
              <InformationBox
                title="How is the schema created?"
                description={
                  <div className="flex flex-col gap-y-2">
                    <p>
                      The following query will be run to create the{' '}
                      <code className="text-xs text-foreground">api</code> schema , as well as to
                      grant the necessary privileges to the respective roles
                    </p>
                    <CodeBlock
                      language="sql"
                      className="p-1 language-bash prose dark:prose-dark max-w-[68.3ch]"
                    >
                      {`create schema if not exists api;\ngrant usage on schema api to anon, authenticated;`}
                    </CodeBlock>
                  </div>
                }
              />
            </div>

            <ButtonTooltip
              type="primary"
              className="w-min mx-5"
              onClick={onSelectCreateAndExposeAPISchema}
              disabled={hasAPISchema && isAPISchemaExposed}
              loading={isCreatingAPISchema}
              tooltip={{
                content: {
                  side: 'right',
                  text:
                    hasAPISchema && isAPISchemaExposed
                      ? 'Schema has already been created and exposed'
                      : undefined,
                },
              }}
            >
              Create and expose schema to Data API
            </ButtonTooltip>

            <div className="flex flex-col gap-y-4 px-5 pb-4">
              <p>
                Under these new settings, the <code className="text-xs text-foreground">anon</code>{' '}
                and <code className="text-xs text-foreground">authenticated</code> roles can execute
                functions defined in the <code className="text-xs text-foreground">api</code>{' '}
                schema, but they have no automatic permissions on any tables. On a table-by-table
                basis, you can grant them permissions by running the following command:
              </p>
              <CodeBlock
                language="sql"
                className="p-1 language-bash prose dark:prose-dark max-w-[68.3ch]"
              >
                {`grant select on table api.<your_table> to anon;\ngrant select, insert, update, delete on table api.<your_table> to authenticated;`}
              </CodeBlock>
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>

        <DialogSectionSeparator />

        <Collapsible_Shadcn_>
          <CollapsibleTrigger_Shadcn_ className="py-4 px-5 w-full flex items-center justify-between text-sm">
            <p>
              2. Remove the <code className="text-xs text-foreground">public</code> schema from the
              exposed schemas
            </p>
            {!isPublicSchemaExposed ? (
              <Check size={16} className="text-brand" />
            ) : (
              <ChevronDown
                size={16}
                className="transition data-open-parent:rotate-180 data-closed-parent:rotate-0"
              />
            )}
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light">
            <div className="px-5 pb-4 flex flex-col gap-y-4">
              <Alert_Shadcn_ variant="warning">
                <WarningIcon />
                <AlertTitle_Shadcn_ className="text-foreground">
                  Ensure that your app is no longer using the{' '}
                  <code className="text-xs text-foreground">public</code> schema
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  The <code className="text-xs text-foreground">public</code> schema will not be
                  accessible via the API once its not exposed. You should be using the{' '}
                  <code className="text-xs text-foreground">api</code> schema instead.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
              <p>
                Click the button below to remove the{' '}
                <code className="text-xs text-foreground">public</code> schema from both Exposed
                schemas and Extra search path in your API configuration.
              </p>
              <ButtonTooltip
                type="primary"
                className="w-min"
                disabled={!isPublicSchemaExposed}
                loading={isUpdatingConfig}
                tooltip={{
                  content: {
                    side: 'right',
                    text: !isPublicSchemaExposed ? 'Public schema no longer exposed' : undefined,
                  },
                }}
                onClick={onSelectRemovePublicSchema}
              >
                Remove public schema from exposed schemas
              </ButtonTooltip>
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
