import { useState } from 'react'
import { toast } from 'sonner'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  DialogSectionSeparator,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { IntegrationDefinition } from '../../Landing/Integrations.constants'
import { getEnableExtensionsSQL } from './IntegrationOverviewTabV2.utils'
import { extensionsWithRecommendedSchemas } from '@/components/interfaces/Database/Extensions/Extensions.constants'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProtectedSchemas } from '@/hooks/useProtectedSchemas'
import { ResponseError } from '@/types'

interface InstallIntegrationSheetProps {
  integration: IntegrationDefinition
}

/**
 * [Joshen] Trying to figure out what the ideal data structure is between local + remote integrations
 * So it might be a bit messy for now as we get more context and build out this UI
 *
 * If the integration provides its own SQL installation command, we'll use that
 * Otherwise if the integration provides its own SQL installation query, we'll use that through the query endpoint
 * Else if the integration only requires extensions, dashboard will generate the queries and fire through the query endpoint
 */

export const InstallIntegrationSheet = ({ integration }: InstallIntegrationSheetProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })

  const [open, setOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const {
    icon,
    name,
    installationSql,
    installationCommand,
    missingExtensionsAlert,
    requiredExtensions: requiredExtensionNames,
  } = integration

  const allowExtensionCustomSchema = !installationSql

  const defaultExtensionsSchema = Object.fromEntries(
    requiredExtensionNames.map((extName) => [extName, { schema: 'extensions', value: undefined }])
  )
  const [extensionsSchema, setExtensionsSchema] = useState<{
    [key: string]: { schema: string; value: string | undefined }
  }>(defaultExtensionsSchema)

  const involvesExtensions = requiredExtensionNames.length > 0
  // [Joshen] Will hook these up in the future, applicable for stripe sync engine
  const involvesEdgeFunctions = false

  const { data: extensions = [] } = useDatabaseExtensionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )
  const requiredExtensions = extensions.filter((ext) => requiredExtensionNames.includes(ext.name))
  // [Joshen] Integration requires extensions that are not available to install on the current database image
  const hasMissingExtensions = requiredExtensionNames.length !== requiredExtensions.length

  const { data: schemas = [] } = useSchemasQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )
  const availableSchemas = schemas.filter(
    (schema) => !protectedSchemas.some((protectedSchema) => protectedSchema.name === schema.name)
  )

  const { mutateAsync: executeSql } = useExecuteSqlMutation({ onError: () => {} })
  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation({ onError: () => {} })

  const enableExtensionsSQL = getEnableExtensionsSQL({
    extensions: requiredExtensions,
    extensionsSchema,
  })
  const installationSQLContent = installationSql ?? enableExtensionsSQL

  const onInstallIntegration = async () => {
    if (!project) return console.error('Project is required')

    setIsInstalling(true)
    const toastId = toast.loading(`Installing ${name}`)

    try {
      if (!!installationCommand) {
        await installationCommand({ ref: project.ref })
      } else if (!!installationSql) {
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
    try {
      await executeSql({ projectRef, connectionString, sql: installationSql })
    } catch (error) {
      throw error
    }
  }

  const installIntegrationExtensions = async () => {
    if (!project) return console.error('Project is required')

    const { ref: projectRef, connectionString } = project
    const results = await Promise.allSettled(
      requiredExtensions.map((ext) => {
        const { name, default_version: version } = ext
        const createSchema = extensionsSchema[name].schema === 'custom'
        const schema =
          name === 'pg_cron'
            ? 'pg_catalog'
            : createSchema
              ? (extensionsSchema[name].value as string)
              : extensionsSchema[name].schema

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
    if (!!failure) throw new Error(failure.reason.message)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="primary">Install integration</Button>
      </SheetTrigger>
      <SheetContent
        size="default"
        aria-describedby={undefined}
        className="flex flex-col gap-0 !w-[550px]"
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

        <div className="flex-grow">
          <SheetSection className="flex flex-col gap-y-4 py-5">
            <div>
              <h4>Installs</h4>
              <p className="text-sm text-foreground-light">
                What this integration will run on your project
              </p>
            </div>

            {hasMissingExtensions && missingExtensionsAlert}

            <Card>
              <CardContent className="px-0 pt-1.5 pb-0">
                <Tabs_Shadcn_ defaultValue="extensions">
                  <TabsList_Shadcn_ className="px-4 space-x-4">
                    {involvesExtensions && (
                      <>
                        <TabsTrigger_Shadcn_
                          value="extensions"
                          className="font-mono uppercase text-xs"
                        >
                          Extensions
                        </TabsTrigger_Shadcn_>
                        <TabsTrigger_Shadcn_ value="sql" className="font-mono uppercase text-xs">
                          SQL
                        </TabsTrigger_Shadcn_>
                      </>
                    )}
                    {involvesEdgeFunctions && (
                      <TabsTrigger_Shadcn_
                        value="edge_functions"
                        className="font-mono uppercase text-xs"
                      >
                        Edge Functions
                      </TabsTrigger_Shadcn_>
                    )}
                  </TabsList_Shadcn_>

                  <TabsContent_Shadcn_ value="extensions" className="mt-0 px-4">
                    {requiredExtensionNames.map((extName) => {
                      const ext = extensions.find((x) => x.name === extName)
                      return (
                        <div key={extName} className="py-3 flex items-center justify-between">
                          <code className="text-xs">{extName}</code>
                          {!ext ? (
                            <Badge>Unavailable</Badge>
                          ) : ext.installed_version ? (
                            <Badge>Installed</Badge>
                          ) : (
                            <Badge>Required</Badge>
                          )}
                        </div>
                      )
                    })}
                  </TabsContent_Shadcn_>
                  <TabsContent_Shadcn_ value="sql" className="mt-0">
                    <CodeBlock
                      hideCopy
                      hideLineNumbers
                      language="pgsql"
                      value={installationSQLContent}
                      wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3')}
                      className="border-0 rounded-none [&_code]:text-[12px] [&_code]:text-foreground max-h-80"
                    />
                  </TabsContent_Shadcn_>
                  <TabsContent_Shadcn_ value="edge_functions" className="mt-0">
                    TBD
                  </TabsContent_Shadcn_>
                </Tabs_Shadcn_>
              </CardContent>
            </Card>
          </SheetSection>

          {allowExtensionCustomSchema && (
            <>
              <DialogSectionSeparator />

              <SheetSection>
                <Accordion_Shadcn_ type="single" collapsible>
                  <AccordionItem_Shadcn_ value="advanced-settings" className="border-none">
                    <AccordionTrigger_Shadcn_ className="font-normal gap-2 py-0 justify-between text-sm hover:no-underline">
                      Advanced settings
                    </AccordionTrigger_Shadcn_>
                    <AccordionContent_Shadcn_ className="!pb-0 pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4">
                      <p className="text-foreground-light">
                        Select which schemas to install the database extensions under
                      </p>
                      {requiredExtensionNames.map((extName) => {
                        const extMeta = extensionsSchema[extName as keyof typeof extensionsSchema]
                        const { schema, value } = extMeta
                        const recommendedSchema = extensionsWithRecommendedSchemas[extName]

                        return (
                          <FormItemLayout
                            key={extName}
                            isReactForm={false}
                            layout="horizontal"
                            label={extName}
                          >
                            <Select_Shadcn_
                              value={schema}
                              onValueChange={(schema) =>
                                setExtensionsSchema((prev) => ({
                                  ...prev,
                                  [extName]: {
                                    schema,
                                    value: schema === 'custom' ? extName : undefined,
                                  },
                                }))
                              }
                            >
                              <SelectTrigger_Shadcn_>
                                <SelectValue_Shadcn_ placeholder="Select a schema" />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectItem_Shadcn_ value="custom">
                                  Create a new schema
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
                                      ) : schema.name === 'extensions' ? (
                                        <Badge className="ml-2">Default</Badge>
                                      ) : null}
                                    </SelectItem_Shadcn_>
                                  )
                                })}
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>

                            {schema === 'custom' && (
                              <FormItemLayout
                                isReactForm={false}
                                className="mt-2"
                                label="Provide a name for your new schema"
                              >
                                <Input
                                  value={value}
                                  onChange={(e) =>
                                    setExtensionsSchema((prev) => ({
                                      ...prev,
                                      [extName]: {
                                        schema: prev[extName].schema,
                                        value: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Provide a name for your schema"
                                />
                              </FormItemLayout>
                            )}
                          </FormItemLayout>
                        )
                      })}
                    </AccordionContent_Shadcn_>
                  </AccordionItem_Shadcn_>
                </Accordion_Shadcn_>
              </SheetSection>
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
