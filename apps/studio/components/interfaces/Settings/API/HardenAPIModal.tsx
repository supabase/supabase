import { Check, ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCreateAndExposeAPISchemaMutation } from 'data/api-settings/create-and-expose-api-schema-mutation'
import { useRemovePublicSchemaAndDisablePgGraphqlMutation } from 'data/api-settings/remove-public-schema-from-expose-and-disable-pg_graphql-mutation'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
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
} from 'ui'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'

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
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef: project?.ref })

  const hasAPISchema = (schemas ?? []).find((schema) => schema.name === 'api')
  const exposedSchemas = config?.db_schema.split(', ') ?? []
  const isAPISchemaExposed = exposedSchemas.includes('api')
  const isPublicSchemaExposed = exposedSchemas.includes('public')

  const pgGraphqlExtension = (extensions ?? []).find((ext) => ext.name === 'pg_graphql')
  const isPgGraphqlInstalled = !!pgGraphqlExtension?.installed_version

  const { mutate: createAndExposeAPISchema, isLoading: isCreatingAPISchema } =
    useCreateAndExposeAPISchemaMutation({
      onSuccess: () => {
        toast.success(`Successfully created api schema and exposed via Data API`)
      },
    })

  const {
    mutate: removePublicSchemaAndDisablePgGraphql,
    isLoading: isRemovingPublicSchemaAndDisablingPgGraphql,
  } = useRemovePublicSchemaAndDisablePgGraphqlMutation({
    onSuccess: () => {
      toast.success(
        'Success removed public schema from exposed schemas and disabled pg_graphql extension'
      )
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

  const onSelectRemovePublicSchemaAndDisablePgGraphql = () => {
    if (project === undefined) return console.error('Project is required')
    if (config === undefined) return console.error('Postgrest config is required')
    if (pgGraphqlExtension === undefined)
      return console.error('Unable to find pg_graphql extension')

    removePublicSchemaAndDisablePgGraphql({
      projectRef: project.ref,
      connectionString: project.connectionString,
      existingPostgrestConfig: {
        max_rows: config.max_rows,
        db_pool: config.db_pool,
        db_schema: config.db_schema,
        db_extra_search_path: config?.db_extra_search_path,
      },
    })
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent size="xlarge">
        <DialogHeader>
          <DialogTitle>Prevent accidental exposure of data via the API</DialogTitle>
          <DialogDescription>
            Expose a custom schema instead of the{' '}
            <code className="text-xs text-foreground">public</code> schema
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm text-foreground-light">
          <p>
            If you want to use the Data API with increased security, we recommend exposing a custom
            schema instead of the <code className="text-xs text-foreground">public</code> schema to
            get more <span className="text-brand">conscious control</span> over your exposed data.
            Any data, views, or functions that should be exposed need to be deliberately put within
            your custom schema instead.
          </p>
          <p className="mt-2">
            This will be particularly useful if your{' '}
            <code className="text-xs text-foreground">public</code> schema is used by other tools as
            a default space, as it will help{' '}
            <span className="text-brand">prevent accidental exposure of data</span> that's
            automatically added to the <code className="text-xs text-foreground">public</code>{' '}
            schema.
          </p>
          <Button asChild type="default" icon={<ExternalLink />} className="w-min mt-4">
            <a
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/database/hardening-data-api"
            >
              Documentation
            </a>
          </Button>
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
            <div className="flex flex-col gap-y-4 px-5 ">
              <p>
                Run the following command to create a new schema named{' '}
                <code className="text-xs text-foreground">api</code> and grant the{' '}
                <code className="text-xs text-foreground">anon</code> and{' '}
                <code className="text-xs text-foreground">authenticated</code> roles usage on this
                schema. Alternatively, you can click on the button below to run the command from
                here.
              </p>
              <CodeBlock
                language="sql"
                className="p-1 language-bash prose dark:prose-dark max-w-[93.2ch]"
              >
                {`create schema if not exists api;\ngrant usage on schema api to anon, authenticated;`}
              </CodeBlock>
            </div>
            <p className="px-5">
              Once the schema is created, you can add{' '}
              <code className="text-xs text-foreground">api</code> to Exposed schemas under the Data
              API settings. Ensure that it is the first schema in the list so that it will be
              searched first by default.
            </p>
            <div className="flex flex-col gap-y-4 px-5">
              <p>
                Under these new settings, the <code className="text-xs text-foreground">anon</code>{' '}
                and <code className="text-xs text-foreground">authenticated</code> roles can execute
                functions defined in the <code className="text-xs text-foreground">api</code>{' '}
                schema, but they have no automatic permissions on any tables. On a table-by-table
                basis, you can grant them permissions by running the following command:
              </p>
              <CodeBlock
                language="sql"
                className="p-1 language-bash prose dark:prose-dark max-w-[93.2ch]"
              >
                {`grant select on table api.<your_table> to anon;\ngrant select, insert, update, delete on table api.<your_table> to authenticated;`}
              </CodeBlock>
            </div>
            <div className="px-5 pb-4 flex items-center justify-end gap-x-2">
              <ButtonTooltip
                type="primary"
                className="w-min"
                onClick={onSelectCreateAndExposeAPISchema}
                disabled={hasAPISchema && isAPISchemaExposed}
                loading={isCreatingAPISchema}
                tooltip={{
                  content: { side: 'bottom', text: 'Schema has already been created and exposed' },
                }}
              >
                Create schema and expose via Data API
              </ButtonTooltip>
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
            {!isPublicSchemaExposed && !isPgGraphqlInstalled ? (
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
                  The <code className="text-xs text-foreground">public</code> schema will no longer
                  be accessible via the API once it has been removed.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
              <div className="flex flex-col gap-y-1">
                <p>
                  Under Data API settings, remove{' '}
                  <code className="text-xs text-foreground">public</code> from Exposed schemas, and
                  remove <code className="text-xs text-foreground">public</code> from Extra search
                  path. You will also need to disable the{' '}
                  <code className="text-xs text-foreground">pg_graphql</code> extension under the{' '}
                  <Link
                    href={`/project/${project?.ref}/database/extensions`}
                    className="transition text-foreground-light hover:text-foreground underline"
                  >
                    Database Extensions
                  </Link>{' '}
                  page.
                </p>
                <p>
                  Alternatively, you can click on the button below to run these actions from here.
                </p>
              </div>
              <div className="flex items-center justify-end">
                <ButtonTooltip
                  type="primary"
                  className="w-min"
                  disabled={!isPublicSchemaExposed && !isPgGraphqlInstalled}
                  loading={isRemovingPublicSchemaAndDisablingPgGraphql}
                  tooltip={{ content: { side: 'bottom', text: 'Public schema no longer exposed' } }}
                  onClick={onSelectRemovePublicSchemaAndDisablePgGraphql}
                >
                  Remove public schema from exposed schemas and disable pg_graphql
                </ButtonTooltip>
              </div>
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
