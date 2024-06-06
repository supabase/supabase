import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

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
  Form_Shadcn_,
  Switch,
} from 'ui'

const VercelIntegrationConnectionForm = ({
  connection,
  integration,
}: {
  connection: IntegrationProjectConnection
  integration: Integration
}) => {
  const envSyncTargets = connection.env_sync_targets ?? []

  const FormSchema = z.object({
    environmentVariablesProduction: z.boolean().default(envSyncTargets.includes('production')),
    environmentVariablesPreview: z.boolean().default(envSyncTargets.includes('preview')),
    environmentVariablesDevelopment: z.boolean().default(envSyncTargets.includes('development')),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      environmentVariablesProduction: envSyncTargets.includes('production'),
      environmentVariablesPreview: envSyncTargets.includes('preview'),
      environmentVariablesDevelopment: envSyncTargets.includes('development'),
    },
  })

  const { mutate: updateVercelConnection } = useVercelConnectionUpdateMutation({
    onSuccess: () => toast.success(`Updated Vercel connection`),
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
      organizationIntegrationId: integration.id,
    })
  }

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={'w-full space-y-6'}>
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
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
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
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
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
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
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
        </div>
      </form>
    </Form_Shadcn_>
  )
}

export default VercelIntegrationConnectionForm
