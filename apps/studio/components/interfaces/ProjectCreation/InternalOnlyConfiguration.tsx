import { useParams } from 'common'
import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { type CloudProvider } from 'shared-data'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FormControl,
  FormField,
  Input,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CloudProviderSelector } from './CloudProviderSelector'
import { HighAvailabilityInput } from './HighAvailabilityInput'
import { PostgresVersionSelector } from './PostgresVersionSelector'
import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'

interface InternalOnlyConfigurationProps {
  form: UseFormReturn<CreateProjectForm>
}

export const InternalOnlyConfiguration = ({ form }: InternalOnlyConfigurationProps) => {
  const { slug } = useParams()
  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

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
        <CollapsibleContent className="pt-2 data-closed:animate-collapsible-up data-open:animate-collapsible-down flex flex-col gap-y-6">
          <div>
            <p className="text-xs text-foreground-lighter mb-6">
              These settings are only visible to internal staff
            </p>
            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="postgresVersionSelection"
                render={({ field }) => (
                  <PostgresVersionSelector
                    field={field}
                    form={form}
                    cloudProvider={form.getValues('cloudProvider') as CloudProvider}
                    organizationSlug={slug}
                    dbRegion={form.getValues('dbRegion')}
                  />
                )}
              />

              <HighAvailabilityInput form={form} />
            </div>
          </div>

          {showNonProdFields && (
            <div>
              <p className="text-xs text-foreground-lighter mb-6">
                The settings below are only applicable for local/staging projects
              </p>
              <div className="flex flex-col gap-y-4">
                <CloudProviderSelector form={form} />

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
                        <Input placeholder="e.g 17.6.1.104" {...field} autoComplete="off" />
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
                        <Input placeholder="e.g t3.nano" {...field} autoComplete="off" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Panel.Content>
  )
}
