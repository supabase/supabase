import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  Form,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import * as z from 'zod'

import { getExtensionDefaultSchema } from '../IntegrationOverviewTabV2.utils'
import { AdvancedSettings } from './AdvancedSettings'
import { InstallationOverview } from './InstallationOverview'
import { InstallationSettings } from './InstallationSettings'
import { type IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import {
  DatabaseExtension,
  useDatabaseExtensionsQuery,
} from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'
import { ResponseError } from '@/types'

export interface InstallIntegrationSheetProps {
  integration: IntegrationDefinition
}

export type ExtensionsSchema = { [key: string]: { schema: string; value: string | undefined } }

const formId = 'installation-settings'

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
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const [open, setOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const {
    icon,
    name,
    inputs = {},
    installationSql,
    installationCommand,
    checkInstallationStatus,
    requiredExtensions: requiredExtensionNames,
  } = integration

  const allowExtensionCustomSchema = !installationSql
  const involvesExtensions = requiredExtensionNames.length > 0

  const schema = useMemo(() => {
    let baseSchema = z.object({})
    Object.entries(inputs).forEach((entry) => {
      const [key, input] = entry
      baseSchema = baseSchema.extend({
        [key]: z.string().min(1, `Please provide a value for ${input.label}`),
      })
    })
    return baseSchema
  }, [inputs])

  const defaultValues = useMemo(() => {
    let values = {} as Record<string, string>
    Object.entries(inputs).forEach((entry) => {
      const [key] = entry
      values[key] = ''
    })
    return values
  }, [inputs])

  const form = useForm<Record<string, string>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(schema),
    defaultValues,
  })

  const { data: extensions = [], isSuccess: isSuccessExtensions } = useDatabaseExtensionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )

  const defaultExtensionsSchema = useMemo(
    () =>
      Object.fromEntries(
        requiredExtensionNames.map((extName) => {
          const ext = extensions.find((x) => x.name === extName)
          const defaultSchema = getExtensionDefaultSchema(ext)
          return [extName, { schema: defaultSchema ?? 'extensions', value: undefined }]
        })
      ),
    [requiredExtensionNames, extensions]
  )
  const [extensionsSchema, setExtensionsSchema] =
    useState<ExtensionsSchema>(defaultExtensionsSchema)

  const requiredExtensions = extensions.filter((ext) => requiredExtensionNames.includes(ext.name))
  const requiredExtensionsToBeInstalled = requiredExtensions.filter((ext) => !ext.installed_version)
  // [Joshen] Integration requires extensions that are not available to install on the current database image
  const hasMissingExtensions = requiredExtensionNames.length !== requiredExtensions.length

  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation({ onError: () => {} })

  /**
   * [Joshen] This is a bit messy again while we're figuring out requirements
   * If the integration has required extensions that are yet to be installed, we'll install those
   * AND if the integration has a provided installation command, we'll run that too
   */
  const onSubmit: SubmitHandler<Record<string, string>> = async (values) => {
    if (!project) return console.error('Project is required')

    setIsInstalling(true)
    const toastId = toast.loading(`Installing ${name}`)

    try {
      if (requiredExtensionsToBeInstalled.length > 0) {
        toast.loading(`Installing required database extensions`, { id: toastId })
        await installRequiredIntegrationExtensions(requiredExtensionsToBeInstalled)
      }
      if (installationCommand) {
        toast.loading(`Installing ${name}`, { id: toastId })
        await installationCommand({ ref: project.ref, track, ...values })
      }

      if (!!checkInstallationStatus) {
        const pollInstallationStatus = async () => {
          try {
            const { ref: projectRef, connectionString } = project || {}
            const status = await checkInstallationStatus({ projectRef, connectionString })
            if (status === 'installed') {
              toast.success(`Successfully installed ${name}`, { id: toastId })
              setOpen(false)
              setIsInstalling(false)
            } else {
              setTimeout(() => pollInstallationStatus(), 5000)
            }
          } catch (error) {
            toast.error(`Failed to install ${name}: ${(error as ResponseError).message}`, {
              id: toastId,
            })
            setIsInstalling(false)
          }
        }
        pollInstallationStatus()
      } else {
        toast.success(`Successfully installed ${name}`, { id: toastId })
        setOpen(false)
        setIsInstalling(false)
      }
    } catch (error) {
      toast.error(`Failed to install ${name}: ${(error as ResponseError).message}`, {
        id: toastId,
      })
      setIsInstalling(false)
    }
  }

  const installRequiredIntegrationExtensions = async (extensions: DatabaseExtension[]) => {
    if (!project) return console.error('Project is required')

    const { ref: projectRef, connectionString } = project
    const results = await Promise.allSettled(
      extensions.map((ext) => {
        const { name, default_version: version } = ext
        const createSchema = extensionsSchema[name].schema === 'custom'

        const defaultSchema = getExtensionDefaultSchema(ext)
        const schema =
          defaultSchema ||
          (createSchema ? (extensionsSchema[name].value as string) : extensionsSchema[name].schema)

        return enableExtension({
          projectRef,
          connectionString,
          schema,
          name,
          version,
          cascade: true,
          createSchema: createSchema || !schema.startsWith('pg_'),
        })
      })
    )

    const failure = results.find((r) => r.status === 'rejected')
    if (failure) throw new Error(failure.reason.message)
  }

  useEffect(() => {
    if (!isSuccessExtensions) return
    setExtensionsSchema(defaultExtensionsSchema)
  }, [isSuccessExtensions, defaultExtensionsSchema])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="primary">Install integration</Button>
      </SheetTrigger>

      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <SheetContent
            size="default"
            aria-describedby={undefined}
            className="flex flex-col gap-0 w-[650px]!"
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

            <div className="grow overflow-y-auto">
              <div className="py-5 flex flex-col gap-y-7">
                {Object.keys(inputs).length > 0 && (
                  <InstallationSettings form={form} integration={integration} />
                )}
                <InstallationOverview
                  integration={integration}
                  extensionsSchema={extensionsSchema}
                />
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
                form={formId}
                htmlType="submit"
                type="primary"
                loading={isInstalling}
                disabled={hasMissingExtensions}
              >
                Install integration
              </Button>
            </SheetFooter>
          </SheetContent>
        </form>
      </Form>
    </Sheet>
  )
}
