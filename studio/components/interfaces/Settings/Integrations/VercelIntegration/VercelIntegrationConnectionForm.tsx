import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  cn,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  IconClock,
  Switch,
} from 'ui'
import * as z from 'zod'

import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { Integration, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useVercelConnectionUpdateMutation } from 'data/integrations/vercel-connection-update-mutate'
import { useFlag, useStore } from 'hooks'

const VercelIntegrationConnectionForm = ({
  connection,
  integration,
}: {
  connection: IntegrationProjectConnection
  integration: Integration
}) => {
  const enableVercelConnectionsConfig = useFlag('enableVercelConnectionsConfig')

  const { ui } = useStore()
  const config = connection.metadata.supabaseConfig

  const FormSchema = z.object({
    environmentVariablesProduction: z
      .boolean()
      .default(config?.environmentVariables?.production ?? true),
    authRedirectUrisProduction: z.boolean().default(config?.authRedirectUris?.production ?? true),
    environmentVariablesPreview: z.boolean().default(config?.environmentVariables?.preview ?? true),
    authRedirectUrisPreview: z.boolean().default(config?.authRedirectUris?.preview ?? true),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      environmentVariablesProduction: config?.environmentVariables?.production ?? true,
      environmentVariablesPreview: config?.environmentVariables?.preview ?? true,
      authRedirectUrisProduction: config?.authRedirectUris?.production ?? true,
      authRedirectUrisPreview: config?.authRedirectUris?.preview ?? true,
    },
  })

  const { mutate: updateVercelConnection, isLoading: isUpdatingVercelConnection } =
    useVercelConnectionUpdateMutation({
      onSuccess: (data) => {
        ui.setNotification({
          category: 'success',
          message: `Updated Supabase directory`,
        })
      },
    })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    /**
     * remove this hardcoded if statement when we are ready to enable this feature
     */
    if (!enableVercelConnectionsConfig) return

    const metadata = {
      ...connection.metadata,
    }

    metadata.supabaseConfig = {
      environmentVariables: {
        production: data.environmentVariablesProduction,
        preview: data.environmentVariablesPreview,
      },
      authRedirectUris: {
        production: data.authRedirectUrisProduction,
        preview: data.authRedirectUrisPreview,
      },
    }

    updateVercelConnection({
      id: connection.id,
      metadata,
      organizationIntegrationId: integration.id,
    })
  }

  return (
    <Form_Shadcn_ {...form}>
      <div className="py-4 px-8">
        <Alert_Shadcn_ variant="default" className="">
          <IconClock className="h-4 w-4" strokeWidth={2} />
          <AlertTitle_Shadcn_>Vercel Connection configuration coming soon</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            This configuration will allow you to control the environment variables and auth
            redirects for production and preview deployments.
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </div>
      <ScaffoldDivider />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(!enableVercelConnectionsConfig && 'opacity-30', 'w-full space-y-6')}
      >
        <div>
          {/* {isUpdatingVercelConnection && 'isUpdatingVercelConnection'} */}
          <div className="flex flex-col gap-6 px-8 py-8">
            <h5 className="text-foreground text-sm">Vercel Production deployments </h5>
            <FormField_Shadcn_
              control={form.control}
              name="environmentVariablesProduction"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                  <div className="">
                    <FormLabel_Shadcn_ className="!text">
                      Sync environment variables for Vercel Production deployments
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Deploy Edge Functions when merged into Production Branch
                    </FormDescription_Shadcn_>
                  </div>
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={!enableVercelConnectionsConfig}
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
                    />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
            {/* <Button htmlType="submit">Submit</Button> */}
            <FormField_Shadcn_
              control={form.control}
              name="authRedirectUrisProduction"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                  <div className="">
                    <FormLabel_Shadcn_ className="!text">
                      Auto update Auth Redirect URIs for Vercel Production Deployments
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Deploy Edge Functions when merged into Production Branch
                    </FormDescription_Shadcn_>
                  </div>
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={!enableVercelConnectionsConfig}
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
                    />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
          </div>
          <ScaffoldDivider />
          <div className="flex flex-col gap-6 px-8 py-8">
            <h5 className="text-foreground text-sm">Vercel Preview deployments </h5>
            <FormField_Shadcn_
              control={form.control}
              name="environmentVariablesPreview"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                  <div className="">
                    <FormLabel_Shadcn_ className="!text">
                      Sync environment variables for Vercel Preview Deployments
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Preview deployments will be able to connect to Supabase Database Preview
                      branches
                    </FormDescription_Shadcn_>
                  </div>
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={!enableVercelConnectionsConfig}
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
                    />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="authRedirectUrisPreview"
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-row items-center justify-between">
                  <div className="">
                    <FormLabel_Shadcn_ className="!text">
                      Auto update Auth Redirect URIs for Vercel Preview Deployments
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                      Deploy Edge Functions when merged into Production Branch
                    </FormDescription_Shadcn_>
                  </div>
                  <FormControl_Shadcn_>
                    <Switch
                      disabled={!enableVercelConnectionsConfig}
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e)
                        form.handleSubmit(onSubmit)()
                      }}
                    />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
          </div>
        </div>
        {/* <Button htmlType="submit">Submit</Button> */}
      </form>
    </Form_Shadcn_>
  )
}

export default VercelIntegrationConnectionForm
