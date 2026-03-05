import Panel from 'components/ui/Panel'
import { usePHFlag } from 'hooks/ui/useFlag'
import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'
import {
  Checkbox_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  useWatch_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'

interface SecurityOptionsProps {
  form: UseFormReturn<CreateProjectForm>
  layout?: 'vertical' | 'horizontal'
}

export const SecurityOptions = ({ form, layout = 'horizontal' }: SecurityOptionsProps) => {
  const rlsExperimentVariant = usePHFlag<'control' | 'test' | false | undefined>(
    'projectCreationEnableRlsEventTrigger'
  )
  const shouldShowEnableRlsEventTrigger = rlsExperimentVariant === 'test'
  const dataApi = useWatch_Shadcn_({ control: form.control, name: 'dataApi' })

  return (
    <Panel.Content className="pb-8">
      <FormItemLayout layout={layout} label="Security" isReactForm={false}>
        <div className="flex flex-col gap-4">
          <FormField_Shadcn_
            name="dataApi"
            control={form.control}
            render={({ field }) => (
              <FormItem_Shadcn_ className="flex items-start gap-3">
                <FormControl_Shadcn_>
                  <Checkbox_Shadcn_
                    checked={field.value}
                    disabled={field.disabled}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                </FormControl_Shadcn_>
                <div className="space-y-1">
                  <FormLabel_Shadcn_ className="text-sm text-foreground">
                    Enable Data API
                  </FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    Autogenerate a RESTful API for your public schema. Recommended if using a client
                    library like{' '}
                    <Link
                      href="https://supabase.com/docs/reference/javascript/introduction"
                      target="_blank"
                      className="text-link"
                    >
                      supabase-js
                    </Link>
                    .
                  </FormDescription_Shadcn_>
                </div>
              </FormItem_Shadcn_>
            )}
          />

          {shouldShowEnableRlsEventTrigger && (
            <FormField_Shadcn_
              name="enableRlsEventTrigger"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex items-start gap-3">
                  <FormControl_Shadcn_>
                    <Checkbox_Shadcn_
                      checked={field.value}
                      disabled={field.disabled}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  </FormControl_Shadcn_>
                  <div className="space-y-1">
                    <FormLabel_Shadcn_ className="text-sm text-foreground">
                      Enable automatic RLS
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-foreground-lighter">
                      Create an event trigger that automatically enables Row Level Security on all
                      new tables in the public schema.
                    </FormDescription_Shadcn_>
                  </div>
                </FormItem_Shadcn_>
              )}
            />
          )}

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
