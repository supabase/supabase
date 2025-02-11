import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { FormActions } from 'components/ui/Forms/FormActions'
import type {
  EnvironmentTargets,
  Integration,
  IntegrationProjectConnection,
} from 'data/integrations/integrations.types'
import { useVercelConnectionUpdateMutation } from 'data/integrations/vercel-connection-update-mutate'
import {
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'

const VercelIntegrationConnectionForm = ({
  disabled,
  connection,
  integration,
}: {
  disabled?: boolean
  connection: IntegrationProjectConnection
  integration: Integration
}) => {
  const envSyncTargets = connection.env_sync_targets ?? []

  const FormSchema = z.object({
    environmentVariablesProduction: z.boolean().default(envSyncTargets.includes('production')),
    environmentVariablesPreview: z.boolean().default(envSyncTargets.includes('preview')),
    environmentVariablesDevelopment: z.boolean().default(envSyncTargets.includes('development')),
    publicEnvVarPrefix: z.string().optional(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      environmentVariablesProduction: envSyncTargets.includes('production'),
      environmentVariablesPreview: envSyncTargets.includes('preview'),
      environmentVariablesDevelopment: envSyncTargets.includes('development'),
      publicEnvVarPrefix: connection.public_env_var_prefix,
    },
  })

  const { mutate: updateVercelConnection, isLoading } = useVercelConnectionUpdateMutation({
    onSuccess: () => {
      form.reset(form.getValues())
      toast.success(`Updated Vercel connection`)
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const {
      environmentVariablesProduction,
      environmentVariablesPreview,
      environmentVariablesDevelopment,
    } = data

    const envSyncTargets: string[] = []

    if (environmentVariablesProduction) envSyncTargets.push('production')
    if (environmentVariablesPreview) envSyncTargets.push('preview')
    if (environmentVariablesDevelopment) envSyncTargets.push('development')

    updateVercelConnection({
      id: connection.id,
      envSyncTargets: envSyncTargets as EnvironmentTargets[],
      publicEnvVarPrefix: data.publicEnvVarPrefix?.trim(),
      organizationIntegrationId: integration.id,
    })
  }

  const vercelConnectionFormId = `vercel-connection-form-${connection.id}`

  return (
    <Form_Shadcn_ {...form}>
      <form
        id={vercelConnectionFormId}
        onSubmit={form.handleSubmit(onSubmit)}
        className={'w-full space-y-6'}
      >
        <div className="px-6 py-4 flex flex-col gap-y-4">
          <h5 className="text-foreground text-sm">
            Sync environment variables for selected target environments
          </h5>
          <div className="flex flex-col gap-4">
            <FormField_Shadcn_
              control={form.control}
              name="environmentVariablesProduction"
              render={({ field }) => (
                <FormItem_Shadcn_ className="space-y-0 flex gap-x-4">
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={disabled}
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl_Shadcn_>
                  <div>
                    <FormLabel_Shadcn_ className="!text">Production</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Sync environment variables for <code>production</code> environment.
                    </FormDescription_Shadcn_>
                  </div>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="environmentVariablesPreview"
              render={({ field }) => (
                <FormItem_Shadcn_ className="space-y-0 flex gap-x-4">
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={disabled}
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl_Shadcn_>
                  <div>
                    <FormLabel_Shadcn_ className="!text">Preview</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Sync environment variables for <code>preview</code> environment.
                    </FormDescription_Shadcn_>
                  </div>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="environmentVariablesDevelopment"
              render={({ field }) => (
                <FormItem_Shadcn_ className="space-y-0 flex gap-x-4">
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={disabled}
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl_Shadcn_>
                  <div>
                    <FormLabel_Shadcn_ className="!text">Development</FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Sync environment variables for <code>development</code> environment.
                    </FormDescription_Shadcn_>
                  </div>
                </FormItem_Shadcn_>
              )}
            />
          </div>
          <h5 className="mt-2 text-foreground text-sm">
            Customize public environment variable prefix
          </h5>
          <div className="flex flex-col gap-4">
            <FormField_Shadcn_
              control={form.control}
              name="publicEnvVarPrefix"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Prefix
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_
                      {...field}
                      className="w-full"
                      disabled={disabled}
                      placeholder="An empty prefix will result in no public env vars"
                    />
                  </FormControl_Shadcn_>
                  <FormDescription_Shadcn_ className="col-start-5 col-span-8 text-xs">
                    e.g.{' '}
                    <code
                      className="cursor-pointer"
                      role="button"
                      onClick={() => {
                        field.onChange('NEXT_PUBLIC_')
                      }}
                    >
                      NEXT_PUBLIC_
                    </code>
                    ,{' '}
                    <code
                      className="cursor-pointer"
                      role="button"
                      onClick={() => {
                        field.onChange('VITE_PUBLIC_')
                      }}
                    >
                      VITE_PUBLIC_
                    </code>
                    ,{' '}
                    <code
                      className="cursor-pointer"
                      role="button"
                      onClick={() => {
                        field.onChange('PUBLIC_')
                      }}
                    >
                      PUBLIC_
                    </code>
                    , etc.
                  </FormDescription_Shadcn_>

                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
          </div>

          {form.formState.isDirty ? (
            <p className="mt-2 text-sm text-warning-600">
              Note: Changing these settings will <strong>not</strong> trigger a resync of
              environment variables.
            </p>
          ) : (
            <div className="mt-2 h-5 w-full" />
          )}

          <FormActions
            disabled={disabled}
            form={vercelConnectionFormId}
            hasChanges={form.formState.isDirty}
            isSubmitting={isLoading}
            handleReset={() => form.reset()}
          />
        </div>
      </form>
    </Form_Shadcn_>
  )
}

export default VercelIntegrationConnectionForm
