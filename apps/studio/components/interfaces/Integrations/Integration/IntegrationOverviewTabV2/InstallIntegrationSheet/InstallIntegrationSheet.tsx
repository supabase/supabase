import { type IntegrationDefinition } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'

import { getExtensionDefaultSchema } from '../IntegrationOverviewTabV2.utils'
import { AdvancedSettings } from './AdvancedSettings'
import { InstallationOverview } from './InstallationOverview'
import { InstallationSettings } from './InstallationSettings'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProtectedSchemas } from '@/hooks/useProtectedSchemas'
import { ResponseError } from '@/types'

export interface InstallIntegrationSheetProps {
  integration: IntegrationDefinition
}

export type ExtensionsSchema = { [key: string]: { schema: string; value: string | undefined } }

/**
 * [Joshen] Trying to figure out what the ideal data structure is between local + remote integrations
 * So it might be a bit messy for now as we get more context and build out this UI
 *
 * If the integration provides its own SQL installation command, we'll use that
 * Otherwise if the integration provides its own SQL installation query, we'll use that through the query endpoint
 * Else if the integration only requires extensions, dashboard will generate the queries and fire through the query endpoint
 *
 */

export const InstallIntegrationSheet = ({ integration }: InstallIntegrationSheetProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })

  const [open, setOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const {
    icon,
    name,
    inputs = {},
    installationSql,
    installationCommand,
    requiredExtensions: requiredExtensionNames,
  } = integration

  const allowExtensionCustomSchema = !installationSql
  const involvesExtensions = requiredExtensionNames.length > 0

  const { data: extensions = [], isSuccess: isSuccessExtensions } = useDatabaseExtensionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )

  const { data: schemas = [] } = useSchemasQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )

  const defaultExtensionsSchema = Object.fromEntries(
    requiredExtensionNames.map((extName) => {
      const ext = extensions.find((x) => x.name === extName)
      const defaultSchema = getExtensionDefaultSchema(ext)
      return [extName, { schema: defaultSchema ?? 'extensions', value: undefined }]
    })
  )
  const [extensionsSchema, setExtensionsSchema] =
    useState<ExtensionsSchema>(defaultExtensionsSchema)

  const requiredExtensions = extensions.filter((ext) => requiredExtensionNames.includes(ext.name))
  // [Joshen] Integration requires extensions that are not available to install on the current database image
  const hasMissingExtensions = requiredExtensionNames.length !== requiredExtensions.length

  const availableSchemas = schemas.filter(
    (schema) => !protectedSchemas.some((protectedSchema) => protectedSchema.name === schema.name)
  )

  const { mutateAsync: executeSql } = useExecuteSqlMutation({ onError: () => {} })
  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation({ onError: () => {} })

  const onInstallIntegration = async () => {
    if (!project) return console.error('Project is required')

    setIsInstalling(true)
    const toastId = toast.loading(`Installing ${name}`)

    try {
      if (installationCommand) {
        await installationCommand({ ref: project.ref })
      } else if (installationSql) {
        await installIntegrationViaSQL()
      } else {
        await installIntegrationExtensions()
      }

      toast.success(`Successfully installed ${name}`, { id: toastId })
      setOpen(false)
    } catch (error) {
      toast.error(`Failed to install ${name}: ${(error as ResponseError).message}`, {
        id: toastId,
      })
    } finally {
      setIsInstalling(false)
    }
  }

  const installIntegrationViaSQL = async () => {
    if (!project) return console.error('Project is required')
    if (!installationSql) return console.error('Installation SQL is required')

    const { ref: projectRef, connectionString } = project
    await executeSql({ projectRef, connectionString, sql: installationSql })
  }

  const installIntegrationExtensions = async () => {
    if (!project) return console.error('Project is required')

    const { ref: projectRef, connectionString } = project
    const results = await Promise.allSettled(
      requiredExtensions
        .filter((ext) => !ext.installed_version)
        .map((ext) => {
          const { name, default_version: version } = ext
          const createSchema = extensionsSchema[name].schema === 'custom'

          const defaultSchema = getExtensionDefaultSchema(ext)
          const schema =
            defaultSchema ||
            (createSchema
              ? (extensionsSchema[name].value as string)
              : extensionsSchema[name].schema)

          return enableExtension({
            projectRef,
            connectionString,
            schema,
            name,
            version,
            cascade: true,
            createSchema,
          })
        })
    )

    const failure = results.find((r) => r.status === 'rejected')
    if (failure) throw new Error(failure.reason.message)
  }

  useEffect(() => {
    if (isSuccessExtensions) return
    setExtensionsSchema(defaultExtensionsSchema)
  }, [isSuccessExtensions, defaultExtensionsSchema])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="primary">Install integration</Button>
      </SheetTrigger>
      <SheetContent
        size="default"
        aria-describedby={undefined}
        className="flex flex-col gap-0 !w-[650px]"
      >
        <SheetHeader className="flex items-center gap-x-4">
          <div className="shrink-0 w-11 h-11 relative bg-white border rounded-md flex items-center justify-center">
            {icon()}
          </div>
          <div className="flex flex-col">
            <SheetTitle>Install {name}</SheetTitle>
            <SheetDescription>Review and configure this integration</SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto">
          <div className="py-5 flex flex-col gap-y-7">
            {Object.keys(inputs).length > 0 && <InstallationSettings integration={integration} />}
            <InstallationOverview integration={integration} extensionsSchema={extensionsSchema} />
          </div>

          {allowExtensionCustomSchema && (
            <>
              <DialogSectionSeparator />
              <AdvancedSettings
                integration={integration}
                extensionsSchema={extensionsSchema}
                setExtensionsSchema={setExtensionsSchema}
              />
            </>
          )}

          <DialogSectionSeparator />
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="default" disabled={isInstalling}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="primary"
            disabled={hasMissingExtensions}
            loading={isInstalling}
            onClick={onInstallIntegration}
          >
            Install integration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
