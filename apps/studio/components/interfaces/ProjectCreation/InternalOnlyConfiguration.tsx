import { CollapsibleContent, CollapsibleTrigger } from '@ui/components/shadcn/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { Collapsible, FormControl, FormField, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'

interface InternalOnlyConfigurationProps {
  form: UseFormReturn<CreateProjectForm>
}

export const InternalOnlyConfiguration = ({ form }: InternalOnlyConfigurationProps) => {
  return (
    <Panel.Content>
      <Collapsible>
        <CollapsibleTrigger className="group/advanced-trigger font-mono uppercase tracking-widest text-xs flex items-center gap-1 text-foreground-lighter/75 hover:text-foreground-light transition data-open:text-foreground-light">
          Internal-only Configuration
          <ChevronRight
            size={16}
            strokeWidth={1}
            className="mr-2 group-data-open/advanced-trigger:rotate-90 group-hover/advanced-trigger:text-foreground-light transition"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 data-closed:animate-collapsible-up data-open:animate-collapsible-down">
          <p className="text-xs text-foreground-lighter mb-6">
            These settings are only applicable for local/staging projects
          </p>
          <div className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="postgresVersion"
              render={({ field }) => (
                <FormItemLayout
                  label="Custom Postgres version"
                  layout="horizontal"
                  description="Specify a custom version of Postgres (defaults to the latest)."
                >
                  <FormControl>
                    <Input_Shadcn_ placeholder="e.g 17.6.1.104" {...field} autoComplete="off" />
                  </FormControl>
                </FormItemLayout>
              )}
            />

            <FormField
              control={form.control}
              name="instanceType"
              render={({ field }) => (
                <FormItemLayout
                  label="Custom instance type"
                  layout="horizontal"
                  description="Specify a custom instance type."
                >
                  <FormControl>
                    <Input_Shadcn_ placeholder="e.g t3.nano" {...field} autoComplete="off" />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Panel.Content>
  )
}
