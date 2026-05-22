import {
  Badge,
  Card,
  CardContent,
  cn,
  SheetSection,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { getEnableExtensionsSQL } from '../IntegrationOverviewTabV2.utils'
import { type ExtensionsSchema, type InstallIntegrationSheetProps } from './InstallIntegrationSheet'
import { Markdown } from '@/components/interfaces/Markdown'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const InstallationOverview = ({
  integration,
  extensionsSchema,
}: InstallIntegrationSheetProps & { extensionsSchema: ExtensionsSchema }) => {
  const { data: project } = useSelectedProjectQuery()

  const {
    steps = [],
    installationSql,
    missingExtensionsAlert,
    requiredExtensions: requiredExtensionNames,
  } = integration

  const involvesExtensions = requiredExtensionNames.length > 0
  // [Joshen] Will hook these up in the future, applicable for stripe sync engine
  const involvesEdgeFunctions = false

  const { data: extensions = [] } = useDatabaseExtensionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )
  const requiredExtensions = extensions.filter((ext) => requiredExtensionNames.includes(ext.name))

  const enableExtensionsSQL = getEnableExtensionsSQL({
    extensions: requiredExtensions.filter((ext) => !ext.installed_version),
    extensionsSchema,
  })
  const installationSQLContent = installationSql ?? enableExtensionsSQL

  // [Joshen] Integration requires extensions that are not available to install on the current database image
  const hasMissingExtensions = requiredExtensionNames.length !== requiredExtensions.length

  return (
    <SheetSection className="flex flex-col gap-y-4 py-0">
      <div>
        <h4>Installs</h4>
        <p className="text-sm text-foreground-light">
          What this integration will run on your project
        </p>
      </div>

      {hasMissingExtensions && missingExtensionsAlert}

      {steps.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <ul className="text-foreground-light text-sm divide-y">
              {steps.map((step) => (
                <li key={step.label} className="px-4 py-2">
                  <Markdown>{step.label}</Markdown>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="px-0 pt-1.5 pb-0">
          <Tabs_Shadcn_ defaultValue="extensions">
            <TabsList_Shadcn_ className="px-4 space-x-4">
              {involvesExtensions && (
                <>
                  <TabsTrigger_Shadcn_ value="extensions" className="font-mono uppercase text-xs">
                    Extensions
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ value="sql" className="font-mono uppercase text-xs">
                    SQL
                  </TabsTrigger_Shadcn_>
                </>
              )}
              {involvesEdgeFunctions && (
                <TabsTrigger_Shadcn_ value="edge_functions" className="font-mono uppercase text-xs">
                  Edge Functions
                </TabsTrigger_Shadcn_>
              )}
            </TabsList_Shadcn_>

            <TabsContent_Shadcn_ value="extensions" className="mt-0 divide-y">
              {requiredExtensionNames.map((extName) => {
                const ext = extensions.find((x) => x.name === extName)
                return (
                  <div key={extName} className="py-3 px-4 flex items-center justify-between">
                    <code className="text-xs">{extName}</code>
                    {!ext ? (
                      <Badge variant="warning">Unavailable</Badge>
                    ) : ext.installed_version ? (
                      <Badge variant="secondary" className="text-foreground-lighter">
                        Installed
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-foreground">
                        Required
                      </Badge>
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
  )
}
