import { UseFormReturn } from 'react-hook-form'
import {
  Checkbox,
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useWatch,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { useTrackDefaultPrivilegesExposure } from '@/hooks/misc/useDataApiRevokeOnCreateDefault'
import { DOCS_URL } from '@/lib/constants'

interface SecurityOptionsProps {
  form: UseFormReturn<CreateProjectForm>
  layout?: 'vertical' | 'horizontal'
}

export const SecurityOptions = ({ form, layout = 'horizontal' }: SecurityOptionsProps) => {
  const dataApi = useWatch({ control: form.control, name: 'dataApi' })

  useTrackDefaultPrivilegesExposure({ surface: 'main', dataApiEnabled: dataApi ?? true })

  return (
    <Panel.Content className="pb-8">
      <FormItemLayout layout={layout} label="Security" isReactForm={false}>
        <div className="flex flex-col gap-4">
          <FormField
            name="dataApi"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={field.disabled}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm text-foreground">Enable Data API</FormLabel>
                  <FormDescription className="text-foreground-lighter">
                    Autogenerate a RESTful API for your public schema. Recommended if using a client
                    library like{' '}
                    <InlineLink href={`${DOCS_URL}/reference/javascript/introduction`}>
                      supabase-js
                    </InlineLink>
                    .
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            name="dataApiDefaultPrivileges"
            control={form.control}
            render={({ field }) => (
              <FormItem
                className={cn(
                  'flex items-start gap-3',
                  !dataApi && 'opacity-50 cursor-not-allowed'
                )}
              >
                <FormControl>
                  {dataApi ? (
                    <Checkbox
                      checked={field.value}
                      disabled={field.disabled}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-not-allowed">
                          <Checkbox checked={field.value} disabled />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Enable the Data API to configure default privileges.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </FormControl>
                <div className="space-y-1">
                  <FormLabel
                    className={cn('text-sm text-foreground', !dataApi && 'text-foreground-muted')}
                  >
                    Automatically expose new tables
                  </FormLabel>
                  <FormDescription className="text-foreground-lighter">
                    Grants privileges to Data API roles by default, exposing new tables.
                    <br />
                    <strong className="font-medium text-foreground-light">
                      We recommend disabling this to control access manually.
                    </strong>
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            name="enableRlsEventTrigger"
            control={form.control}
            render={({ field }) => (
              <FormItem className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={field.disabled}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm text-foreground">Enable automatic RLS</FormLabel>
                  <FormDescription className="text-foreground-lighter">
                    Create an event trigger that automatically enables Row Level Security on all new
                    tables in the public schema.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {!dataApi && (
            <Admonition
              type="warning"
              title="Client libraries need Data API to query your database"
            >
              Disabling it means supabase-js and similar libraries can't query or mutate data.
            </Admonition>
          )}
        </div>
      </FormItemLayout>
    </Panel.Content>
  )
}
