import { type Dispatch, type SetStateAction } from 'react'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Badge,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetSection,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { getExtensionDefaultSchema } from '../IntegrationOverviewTabV2.utils'
import { type ExtensionsSchema, type InstallIntegrationSheetProps } from './InstallIntegrationSheet'
import { extensionsWithRecommendedSchemas } from '@/components/interfaces/Database/Extensions/Extensions.constants'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProtectedSchemas } from '@/hooks/useProtectedSchemas'

type AdvancedSettingsProps = InstallIntegrationSheetProps & {
  extensionsSchema: ExtensionsSchema
  setExtensionsSchema: Dispatch<SetStateAction<ExtensionsSchema>>
}

export const AdvancedSettings = ({
  integration,
  extensionsSchema,
  setExtensionsSchema,
}: AdvancedSettingsProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })
  const { requiredExtensions: requiredExtensionNames } = integration

  const involvesExtensions = requiredExtensionNames.length > 0
  const { data: extensions = [] } = useDatabaseExtensionsQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )

  const { data: schemas = [] } = useSchemasQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: involvesExtensions }
  )
  const availableSchemas = schemas.filter(
    (schema) => !protectedSchemas.some((protectedSchema) => protectedSchema.name === schema.name)
  )

  return (
    <SheetSection>
      <Accordion_Shadcn_ type="single" collapsible>
        <AccordionItem_Shadcn_ value="advanced-settings" className="border-none">
          <AccordionTrigger_Shadcn_ className="font-normal gap-2 py-0 justify-between text-sm hover:no-underline">
            Advanced settings
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="pb-0! pt-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-y-4">
            <p className="text-foreground-light">
              Select which schemas to install the database extensions under
            </p>
            {requiredExtensionNames.map((extName) => {
              const ext = extensions.find((x) => x.name === extName)
              const extMeta = extensionsSchema[extName]
              const { schema, value } = extMeta
              const recommendedSchema = extensionsWithRecommendedSchemas[extName]
              const defaultSchema = getExtensionDefaultSchema(ext)

              return (
                <FormItemLayout
                  key={extName}
                  isReactForm={false}
                  layout="horizontal"
                  label={extName}
                  description={
                    ext?.installed_version ? (
                      <>
                        Installed in <code className="text-code-inline">{ext.schema}</code> schema
                      </>
                    ) : defaultSchema ? (
                      <>
                        Must be installed in the{' '}
                        <code className="text-code-inline">{defaultSchema}</code> schema
                      </>
                    ) : recommendedSchema ? (
                      <>
                        Use the <code className="text-code-inline">{recommendedSchema}</code> schema
                        for full compatibility with related features
                      </>
                    ) : undefined
                  }
                >
                  <Select_Shadcn_
                    disabled={!!defaultSchema || !!ext?.installed_version}
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
                      <SelectItem_Shadcn_ value="custom">Create a new schema</SelectItem_Shadcn_>
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
                      {defaultSchema &&
                      !availableSchemas.some((schema) => schema.name === defaultSchema) ? (
                        <SelectItem_Shadcn_ key={defaultSchema} value={defaultSchema}>
                          {defaultSchema}
                          <Badge className="ml-2">Default</Badge>
                        </SelectItem_Shadcn_>
                      ) : null}
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
  )
}
