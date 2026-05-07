import { useFlag } from 'common'
import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  FormControl,
  FormField,
  FormItem,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import { DocsButton } from '@/components/ui/DocsButton'
import Panel from '@/components/ui/Panel'
import { DOCS_URL } from '@/lib/constants'

interface AdvancedConfigurationProps {
  form: UseFormReturn<CreateProjectForm>
}

export const AdvancedConfiguration = ({ form }: AdvancedConfigurationProps) => {
  const disableOrioleProjectCreation = useFlag('disableOrioleProjectCreation')

  return (
    <Panel.Content>
      <Collapsible_Shadcn_>
        <CollapsibleTrigger_Shadcn_ className="group/advanced-trigger font-mono uppercase tracking-widest text-xs flex items-center gap-1 text-foreground-lighter/75 hover:text-foreground-light transition data-open:text-foreground-light">
          Advanced Configuration
          <ChevronRight
            size={16}
            strokeWidth={1}
            className="mr-2 group-data-open/advanced-trigger:rotate-90 group-hover/advanced-trigger:text-foreground-light transition"
          />
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_
          className={cn(
            'pt-2 data-closed:animate-collapsible-up data-open:animate-collapsible-down'
          )}
        >
          <p className="text-xs text-foreground-lighter mb-6">
            These settings cannot be changed after the project is created
          </p>
          <FormField
            name="useOrioleDb"
            control={form.control}
            render={({ field }) => (
              <>
                <FormItemLayout
                  layout="horizontal"
                  label="Postgres Type"
                  className="[&>div>label]:break-normal!"
                >
                  <FormControl>
                    <RadioGroupStacked
                      // Due to radio group not supporting boolean values
                      // value is converted to boolean
                      onValueChange={(value) => field.onChange(value === 'true')}
                      defaultValue={field.value.toString()}
                    >
                      <FormItem asChild>
                        <FormControl>
                          <RadioGroupStackedItem
                            value="false"
                            // @ts-ignore
                            label={
                              <>
                                Postgres
                                <Badge>Default</Badge>
                              </>
                            }
                            description="Recommended for production workloads"
                            className="[&>div>div>p]:text-left [&>div>div>p]:text-xs [&>div>div>label]:flex [&>div>div>label]:items-center [&>div>div>label]:gap-x-2"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem asChild>
                        <FormControl>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <RadioGroupStackedItem
                                value="true"
                                // @ts-ignore
                                label={
                                  <>
                                    Postgres with OrioleDB
                                    <Badge variant="warning">Alpha</Badge>
                                  </>
                                }
                                description="Not recommended for production workloads"
                                className={cn(
                                  '[&>div>div>p]:text-left [&>div>div>p]:text-xs [&>div>div>label]:flex [&>div>div>label]:items-center [&>div>div>label]:gap-x-2',
                                  form.getValues('useOrioleDb') ? 'rounded-b-none!' : ''
                                )}
                                disabled={disableOrioleProjectCreation}
                              />
                            </TooltipTrigger>
                            {disableOrioleProjectCreation && (
                              <TooltipContent side="right" className="w-60 text-center">
                                OrioleDB is temporarily disabled for new projects. Please try again
                                later.
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </FormControl>
                      </FormItem>
                    </RadioGroupStacked>
                  </FormControl>
                  {form.getValues('useOrioleDb') && (
                    <Admonition
                      type="warning"
                      className="rounded-t-none [&>div]:text-xs"
                      title="OrioleDB is not production ready"
                      description="Postgres with OrioleDB extension is currently in Public Alpha and not recommended for production usage yet."
                    >
                      <DocsButton className="mt-2" href={`${DOCS_URL}/guides/database/orioledb`} />
                    </Admonition>
                  )}
                </FormItemLayout>
              </>
            )}
          />
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>
    </Panel.Content>
  )
}
