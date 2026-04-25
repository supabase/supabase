import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input_Shadcn_,
  Switch,
} from 'ui'
import * as z from 'zod'

import { FormActions } from '@/components/ui/Forms/FormActions'
import type {
  EnvironmentTargets,
  Integration,
  IntegrationProjectConnection,
} from '@/data/integrations/integrations.types'
import { useVercelConnectionUpdateMutation } from '@/data/integrations/vercel-connection-update-mutate'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'

const VercelIntegrationConnectionForm = ({
  disabled,
  connection,
  integration,
}: {
  disabled?: boolean
  connection: IntegrationProjectConnection
  integration: Integration
}) => {
  // NOTE(kamil): Ignore sync targets for Vercel Marketplace as it's not synchronized using integration,
  // but through a separate marketplace mechanism. It's not theoretically necessary, but we might have some stale data.
  const { data: org } = useSelectedOrganizationQuery()
  const envSyncTargets =
    org?.managed_by === 'vercel-marketplace' ? [] : (connection.env_sync_targets ?? [])

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

  const { mutate: updateVercelConnection, isPending } = useVercelConnectionUpdateMutation({
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
    <Form {...form}>
      <form
        id={vercelConnectionFormId}
        onSubmit={form.handleSubmit(onSubmit)}
        className={'w-full space-y-6'}
      >
        <div className="px-6 py-4 flex flex-col gap-y-4">
          <div className="flex flex-col gap-4">
            {org?.managed_by === 'vercel-marketplace' ? (
              <Alert_Shadcn_>
                <AlertTitle_Shadcn_ className="text-sm">
                  Vercel Marketplace managed project
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="text-xs">
                  This project is managed via Vercel Marketplace. Environment variables are
                  automatically synchronized for your connected Vercel projects. This integration
                  purpose is synchronizing preview deployments environment variables with our{' '}
                  <Link
                    target="_blank"
                    rel="noreferrer"
                    href={`${DOCS_URL}/guides/platform/branching`}
                    className="underline"
                  >
                    Branching
                  </Link>{' '}
                  feature.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : (
              <div>
                <h5 className="text-foreground ">
                  Sync environment variables for selected target environments
                </h5>

                <FormField
                  control={form.control}
                  name="environmentVariablesProduction"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex gap-x-4">
                      <FormControl>
                        <Switch
                          disabled={disabled}
                          className="mt-1"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="!text">Production</FormLabel>
                        <FormDescription className="text-xs text-foreground-lighter">
                          Sync environment variables for <code>production</code> environment.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="environmentVariablesPreview"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex gap-x-4">
                      <FormControl>
                        <Switch
                          disabled={disabled}
                          className="mt-1"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="!text">Preview</FormLabel>
                        <FormDescription className="text-xs text-foreground-lighter">
                          Sync environment variables for <code>preview</code> environment.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="environmentVariablesDevelopment"
                  render={({ field }) => (
                    <FormItem className="space-y-0 flex gap-x-4">
                      <FormControl>
                        <Switch
                          disabled={disabled}
                          className="mt-1"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="!text">Development</FormLabel>
                        <FormDescription className="text-xs text-foreground-lighter">
                          Sync environment variables for <code>development</code> environment.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          <h5 className="mt-2 text-foreground">Customize public environment variable prefix</h5>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="publicEnvVarPrefix"
              render={({ field }) => (
                <FormItem className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Prefix
                  </FormLabel>
                  <FormControl className="col-span-8">
                    <Input_Shadcn_
                      {...field}
                      className="w-full"
                      disabled={disabled}
                      placeholder="An empty prefix will result in no public env vars"
                    />
                  </FormControl>
                  <FormDescription className="col-start-5 col-span-8 text-xs">
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
                  </FormDescription>

                  <FormMessage className="col-start-5 col-span-8" />
                </FormItem>
              )}
            />
          </div>

          {form.formState.isDirty ? (
            <p className="mt-2 text-sm text-warning">
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
            isSubmitting={isPending}
            handleReset={() => form.reset()}
          />
        </div>
      </form>
    </Form>
  )
}

export default VercelIntegrationConnectionForm
