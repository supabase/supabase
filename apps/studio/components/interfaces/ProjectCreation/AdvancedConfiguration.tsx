import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import { CreateProjectForm } from 'pages/new/[slug]'
import {
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DocsButton } from 'components/ui/DocsButton'

interface AdvancedConfigurationProps {
  form: UseFormReturn<CreateProjectForm>
}

export const AdvancedConfiguration = ({ form }: AdvancedConfigurationProps) => {
  return (
    <Panel.Content>
      <Collapsible_Shadcn_>
        <CollapsibleTrigger_Shadcn_ className="group/advanced-trigger font-mono uppercase tracking-widest text-xs flex items-center gap-1 text-foreground-lighter/75 hover:text-foreground-light transition data-[state=open]:text-foreground-light">
          Advanced Configuration
          <ChevronRight
            size={16}
            strokeWidth={1}
            className="mr-2 group-data-[state=open]/advanced-trigger:rotate-90 group-hover/advanced-trigger:text-foreground-light transition"
          />
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_
          className={cn(
            'pt-5 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
          )}
        >
          <FormField_Shadcn_
            name="useOrioleDb"
            control={form.control}
            render={({ field }) => (
              <>
                <FormItemLayout
                  layout="horizontal"
                  label="Postgres Type"
                  className="[&>div>label]:!break-normal"
                >
                  <FormControl_Shadcn_>
                    <RadioGroupStacked
                      // Due to radio group not supporting boolean values
                      // value is converted to boolean
                      onValueChange={(value) => field.onChange(value === 'true')}
                      defaultValue={field.value.toString()}
                    >
                      <FormItem_Shadcn_ asChild>
                        <FormControl_Shadcn_>
                          <RadioGroupStackedItem
                            value="false"
                            // @ts-ignore
                            label={
                              <>
                                Postgres
                                <Badge color="scale" className="ml-2">
                                  Default
                                </Badge>
                              </>
                            }
                            description="Recommended for production workloads"
                            className="[&>div>div>p]:text-left [&>div>div>p]:text-xs"
                          />
                        </FormControl_Shadcn_>
                      </FormItem_Shadcn_>
                      <FormItem_Shadcn_ asChild>
                        <FormControl_Shadcn_>
                          <RadioGroupStackedItem
                            value="true"
                            // @ts-ignore
                            label={
                              <>
                                Postgres with OrioleDB
                                <Badge color="warning" className="ml-2">
                                  Preview
                                </Badge>
                              </>
                            }
                            description="Not recommended for production workloads"
                            className={cn(
                              '[&>div>div>p]:text-left [&>div>div>p]:text-xs',
                              form.getValues('useOrioleDb') ? '!rounded-b-none' : ''
                            )}
                          />
                        </FormControl_Shadcn_>
                      </FormItem_Shadcn_>
                    </RadioGroupStacked>
                  </FormControl_Shadcn_>
                  {form.getValues('useOrioleDb') && (
                    <Admonition
                      type="warning"
                      className="rounded-t-none [&>div]:text-xs"
                      title="OrioleDB is not production ready"
                      description="Postgres with OrioleDB extension is currently in public alpha and not recommended for production usage yet."
                    >
                      <DocsButton
                        className="mt-2"
                        href="https://supabase.com/docs/guides/database/orioledb"
                      />
                    </Admonition>
                  )}
                </FormItemLayout>
              </>
            )}
          />

          <p className="text-xs text-foreground-lighter text-right mt-3">
            These settings cannot be changed after the project is created
          </p>
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>
    </Panel.Content>
  )
}
