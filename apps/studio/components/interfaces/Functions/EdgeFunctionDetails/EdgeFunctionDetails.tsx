import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useEdgeFunctionDeleteMutation } from 'data/edge-functions/edge-functions-delete-mutation'
import { useEdgeFunctionUpdateMutation } from 'data/edge-functions/edge-functions-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  CodeBlock,
  CriticalIcon,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  Switch,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import CommandRender from '../CommandRender'
import { INVOCATION_TABS } from './EdgeFunctionDetails.constants'
import { generateCLICommands } from './EdgeFunctionDetails.utils'

const FormSchema = z.object({
  name: z.string().min(0, 'Name is required'),
  verify_jwt: z.boolean(),
})

export const EdgeFunctionDetails = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const canUpdateEdgeFunction = useCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')

  const { data: apiKeys } = useAPIKeysQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const {
    data: selectedFunction,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })

  const { mutate: updateEdgeFunction, isLoading: isUpdating } = useEdgeFunctionUpdateMutation()
  const { mutate: deleteEdgeFunction, isLoading: isDeleting } = useEdgeFunctionDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted "${selectedFunction?.name}"`)
      router.push(`/project/${projectRef}/functions`)
    },
  })

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', verify_jwt: false },
  })

  const { anonKey, publishableKey } = getKeys(apiKeys)
  const apiKey = publishableKey?.api_key ?? anonKey?.api_key ?? '[YOUR ANON KEY]'

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const functionUrl =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}/functions/v1/${selectedFunction?.slug}`
      : `${protocol}://${endpoint}/functions/v1/${selectedFunction?.slug}`
  const hasImportMap = useMemo(
    () => selectedFunction?.import_map || selectedFunction?.import_map_path,
    [selectedFunction]
  )
  const { managementCommands } = generateCLICommands({
    selectedFunction,
    functionUrl,
    anonKey: apiKey,
  })

  const onUpdateFunction: SubmitHandler<z.infer<typeof FormSchema>> = async (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFunction === undefined) return console.error('No edge function selected')

    updateEdgeFunction(
      {
        projectRef,
        slug: selectedFunction.slug,
        payload: values,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully updated edge function`)
        },
      }
    )
  }

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (selectedFunction === undefined) return console.error('No edge function selected')
    deleteEdgeFunction({ projectRef, slug: selectedFunction.slug })
  }

  useEffect(() => {
    if (selectedFunction) {
      form.reset({
        name: selectedFunction.name,
        verify_jwt: selectedFunction.verify_jwt,
      })
    }
  }, [selectedFunction])

  return (
    <div className="mx-auto flex flex-col-reverse 2xl:flex-row gap-8 pb-8">
      <div className="flex-1 min-w-0 overflow-hidden">
        <ScaffoldSection isFullWidth className="!pt-0 2xl:first:!pt-12">
          <ScaffoldSectionTitle className="mb-4">Function Configuration</ScaffoldSectionTitle>
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onUpdateFunction)}>
              <Card>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Name"
                        layout="flex-row-reverse"
                        description="Your slug and endpoint URL will remain the same"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            className="w-64"
                            disabled={!canUpdateEdgeFunction}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="verify_jwt"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Verify JWT with legacy secret"
                        layout="flex-row-reverse"
                        description={
                          <>
                            Requires that a JWT signed{' '}
                            <em className="text-brand not-italic">only by the legacy JWT secret</em>{' '}
                            is present in the <code>Authorization</code> header. The easy to obtain{' '}
                            <code>anon</code> key can be used to satisfy this requirement.
                            Recommendation: OFF with JWT and additional authorization logic
                            implemented inside your function's code.
                          </>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdateEdgeFunction}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button type="default" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!canUpdateEdgeFunction || !form.formState.isDirty}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </ScaffoldSection>
        <ScaffoldSection isFullWidth>
          <ScaffoldSectionTitle className="mb-4">Invoke function</ScaffoldSectionTitle>
          <Card>
            <CardContent>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="flex flex-wrap gap-4">
                  {INVOCATION_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {INVOCATION_TABS.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-4">
                    <div className="overflow-x-auto">
                      <CodeBlock
                        language={tab.language}
                        hideLineNumbers={tab.hideLineNumbers}
                        className="p-0 text-xs !mt-0 border-none"
                        value={tab.code(functionUrl, selectedFunction?.name ?? '', apiKey)}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </ScaffoldSection>
        <ScaffoldSection isFullWidth>
          <ScaffoldSectionTitle className="mb-4">Develop locally</ScaffoldSectionTitle>
          <div className="rounded border bg-surface-100 px-6 py-4 drop-shadow-sm">
            <div className="space-y-6">
              <CommandRender
                commands={[
                  {
                    command: `supabase functions download ${selectedFunction?.slug}`,
                    description: 'Download the function to your local machine',
                    jsx: () => (
                      <>
                        <span className="text-brand-600">supabase</span> functions download{' '}
                        {selectedFunction?.slug}
                      </>
                    ),
                    comment: '1. Download the function',
                  },
                ]}
              />
              <CommandRender commands={[managementCommands[0]]} />
              <CommandRender commands={[managementCommands[1]]} />
            </div>
          </div>
        </ScaffoldSection>
        <ScaffoldSection isFullWidth>
          <ScaffoldSectionTitle className="mb-4">Delete function</ScaffoldSectionTitle>
          <Alert_Shadcn_ variant="destructive">
            <CriticalIcon />
            <AlertTitle_Shadcn_>
              Once your function is deleted, it can no longer be restored
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Make sure you have made a backup if you want to restore your edge function
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3">
              <Button
                type="danger"
                disabled={!canUpdateEdgeFunction}
                loading={selectedFunction?.id === undefined}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete edge function
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </ScaffoldSection>

        <ConfirmationModal
          visible={showDeleteModal}
          loading={isDeleting}
          variant="destructive"
          confirmLabel="Delete"
          confirmLabelLoading="Deleting"
          title={`Confirm to delete ${selectedFunction?.name}`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={onConfirmDelete}
          alert={{
            base: { variant: 'destructive' },
            title: 'This action cannot be undone',
            description:
              'Ensure that you have made a backup if you want to restore your edge function',
          }}
        />
      </div>

      <div className="w-full 2xl:max-w-[600px] shrink-0">
        <ScaffoldSection isFullWidth className="!pt-6 2xl:first:!pt-12">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isLoading && <GenericSkeletonLoader />}
              {isError && (
                <AlertError error={error} subject="Failed to retrieve edge function details" />
              )}
              {isSuccess && (
                <dl className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-y-4 xl:gap-y-6 gap-x-10">
                  <dt className="text-sm text-foreground-light">Slug</dt>
                  <dd className="text-sm lg:text-left">{selectedFunction?.slug}</dd>

                  <dt className="text-sm text-foreground-light">Endpoint URL</dt>
                  <dd className="text-sm lg:text-left">
                    <Input
                      className="font-mono input-mono"
                      disabled
                      copy
                      size="small"
                      value={functionUrl}
                    />
                  </dd>

                  <dt className="text-sm text-foreground-light">Region</dt>
                  <dd className="text-sm lg:text-left">All functions are deployed globally</dd>

                  <dt className="text-sm text-foreground-light">Created at</dt>
                  <dd className="text-sm lg:text-left">
                    {dayjs(selectedFunction?.created_at ?? 0).format('dddd, MMMM D, YYYY h:mm A')}
                  </dd>

                  <dt className="text-sm text-foreground-light">Last updated at</dt>
                  <dd className="text-sm lg:text-left">
                    {dayjs(selectedFunction?.updated_at ?? 0).format('dddd, MMMM D, YYYY h:mm A')}
                  </dd>

                  <dt className="text-sm text-foreground-light">Deployments</dt>
                  <dd className="text-sm lg:text-left">{selectedFunction?.version ?? 0}</dd>

                  <dt className="text-sm text-foreground-light">Import Maps</dt>
                  <dd className="text-sm lg:text-left">
                    <p>
                      Import maps are{' '}
                      <span className={cn(hasImportMap ? 'text-brand' : 'text-amber-900')}>
                        {hasImportMap ? 'used' : 'not used'}
                      </span>{' '}
                      for this function
                    </p>
                    <p className="text-foreground-light mt-1">
                      Import maps allow the use of bare specifiers in functions instead of explicit
                      import URLs
                    </p>
                    <div className="mt-4">
                      <Button
                        asChild
                        type="default"
                        size="tiny"
                        icon={<ExternalLink strokeWidth={1.5} />}
                      >
                        <Link
                          href="https://supabase.com/docs/guides/functions/dependencies"
                          target="_blank"
                          rel="noreferrer"
                        >
                          More about import maps
                        </Link>
                      </Button>
                    </div>
                  </dd>
                </dl>
              )}
            </CardContent>
          </Card>
        </ScaffoldSection>
      </div>
    </div>
  )
}
