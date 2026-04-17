import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { Button, Card, CardContent, FormControl_Shadcn_, FormField_Shadcn_, SheetSection } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { type InstallIntegrationSheetProps } from './InstallIntegrationSheet'

export const InstallationSettings = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  integration,
  form,
}: InstallIntegrationSheetProps & {
  form: UseFormReturn<TFieldValues, any, TFieldValues>
}) => {
  const { inputs = {} } = integration

  return (
    <SheetSection className="flex flex-col gap-y-4 py-0">
      <div>
        <h4>Settings</h4>
        <p className="text-sm text-foreground-light">Configure the integration</p>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {Object.entries(inputs).map((entry) => {
            const [key, input] = entry
            const { type, label, description, required, actions = [] } = input

            return (
              <div key={key} className="flex flex-col gap-y-2 p-4">
                <FormField_Shadcn_
                  key={key}
                  name={key as TName}
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      isReactForm={false}
                      name={key}
                      label={label}
                      description={description}
                    >
                      <FormControl_Shadcn_>
                        <Input
                          type={type}
                          placeholder={required ? 'Provide a value' : undefined}
                          {...field}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {actions.length > 0 && (
                  <div className="flex items-center gap-x-2">
                    {actions.map((action) => {
                      const isExternal = action.href.startsWith('https')
                      return (
                        <Button
                          asChild
                          key={action.label}
                          type="default"
                          icon={isExternal ? <ExternalLink /> : undefined}
                        >
                          <Link
                            href={action.href}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                          >
                            {action.label}
                          </Link>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </SheetSection>
  )
}
