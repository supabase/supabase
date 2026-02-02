import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  CodeBlock,
  CriticalIcon,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Switch,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  cn,
  copyToClipboard,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import CommandRender from '../CommandRender'
import { INVOCATION_TABS } from './EdgeFunctionDetails.constants'
import { generateCLICommands } from './EdgeFunctionDetails.utils'
import AlertError from '@/components/ui/AlertError'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from '@/data/custom-domains/custom-domains-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useEdgeFunctionDeleteMutation } from '@/data/edge-functions/edge-functions-delete-mutation'
import { useEdgeFunctionUpdateMutation } from '@/data/edge-functions/edge-functions-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

const FormSchema = z.object({
  name: z.string().min(0, 'Name is required'),
  verify_jwt: z.boolean(),
})

export const EdgeFunctionDetails = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()

  const showAllEdgeFunctionInvocationExamples = useIsFeatureEnabled(
    'edge_functions:show_all_edge_function_invocation_examples'
  )
  const invocationTabs = useMemo(() => {
    if (showAllEdgeFunctionInvocationExamples) return INVOCATION_TABS
    return INVOCATION_TABS.filter((tab) => tab.id === 'curl' || tab.id === 'supabase-js')
  }, [showAllEdgeFunctionInvocationExamples])

  const [showKey, setShowKey] = useState(false)
  const [selectedTab, setSelectedTab] = useState(invocationTabs[0].id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { can: canUpdateEdgeFunctionPermission } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_WRITE,
    '*'
  )

  const canUpdateEdgeFunction = IS_PLATFORM && canUpdateEdgeFunctionPermission

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery(
    {
      projectRef,
    },
    { enabled: canReadAPIKeys }
  )
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const {
    data: selectedFunction,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })

  const { mutate: updateEdgeFunction, isPending: isUpdating } = useEdgeFunctionUpdateMutation()
  const { mutate: deleteEdgeFunction, isPending: isDeleting } = useEdgeFunctionDeleteMutation({
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
    <PageContainer size="full">
      <PageSection orientation="horizontal">
        <PageSectionSummary className="gap-6 !self-start">
          <PageSectionTitle>Details</PageSectionTitle>
          {isLoading && <GenericSkeletonLoader />}
          {isError && (
            <AlertError
              error={error}
              subject="Failed to retrieve edge function details"
              layout="vertical"
            />
          )}
          {isSuccess && (
            <dl className="grid grid-cols-1 @xl:grid-cols-[auto_1fr] gap-y-2 [&>dd]:mb-3 @xl:[&>dd]:mb-0 @xl:gap-y-4 gap-x-10">
              <dt className="text-sm text-foreground-light">Slug</dt>
              <dd className="text-sm @lg:text-left">{selectedFunction?.slug}</dd>

              <dt className="text-sm text-foreground-light">Endpoint URL</dt>
              <dd className="text-sm @lg:text-left">
                <Input
                  copy
                  readOnly
                  size="small"
                  className="font-mono input-mono"
                  value={functionUrl}
                />
              </dd>

              {IS_PLATFORM && (
                <>
                  <dt className="text-sm text-foreground-light">Region</dt>
                  <dd className="text-sm @lg:text-left">All functions are deployed globally</dd>
                </>
              )}

              <dt className="text-sm text-foreground-light">Created at</dt>
              <dd className="text-sm @lg:text-left">
                {dayjs(selectedFunction?.created_at ?? 0).format('dddd, MMMM D, YYYY h:mm A')}
              </dd>

              <dt className="text-sm text-foreground-light">Last updated at</dt>
              <dd className="text-sm @lg:text-left">
                {dayjs(selectedFunction?.updated_at ?? 0).format('dddd, MMMM D, YYYY h:mm A')}
              </dd>

              <dt className="text-sm text-foreground-light">Deployments</dt>
              <dd className="text-sm @lg:text-left">{selectedFunction?.version ?? 0}</dd>

              <dt className="text-sm text-foreground-light">Import Maps</dt>
              <dd className="text-sm @lg:text-left">
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
                      href={`${DOCS_URL}/guides/functions/dependencies`}
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
        </PageSectionSummary>
        <PageSectionContent>
          <PageSection className="pt-0">
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Function configuration</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
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
                              <Input
                                {...field}
                                className="w-64"
                                disabled={!canUpdateEdgeFunction}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                    {IS_PLATFORM && (
                      <>
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
                                    <em className="text-brand not-italic">
                                      only by the legacy JWT secret
                                    </em>{' '}
                                    is present in the <code>Authorization</code> header. The easy to
                                    obtain <code>anon</code> key can be used to satisfy this
                                    requirement. Recommendation: OFF with JWT and additional
                                    authorization logic implemented inside your function's code.
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
                      </>
                    )}
                  </Card>
                </form>
              </Form_Shadcn_>
            </PageSectionContent>
          </PageSection>

          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Invoke function</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              <Card>
                <CardContent className="px-0">
                  <Tabs
                    className="w-full"
                    defaultValue="curl"
                    value={selectedTab}
                    onValueChange={setSelectedTab}
                  >
                    <TabsList className="flex flex-wrap gap-4 px-6">
                      {invocationTabs.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id}>
                          {tab.label}
                        </TabsTrigger>
                      ))}
                      {selectedTab === 'curl' && (
                        <Button
                          type="default"
                          className="ml-auto -translate-y-2 translate-x-3"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? 'Hide' : 'Show'} anon key
                        </Button>
                      )}
                    </TabsList>
                    {invocationTabs.map((tab) => {
                      const code = tab.code({
                        showKey,
                        functionUrl,
                        functionName: selectedFunction?.name ?? '',
                        apiKey,
                      })

                      return (
                        <TabsContent key={tab.id} value={tab.id} className="mt-4 px-6">
                          <CodeBlock
                            value={code}
                            className={cn(
                              'p-0 text-xs !mt-0 border-none [&>code]:!whitespace-pre-wrap',
                              showKey ? '[&>code]:break-all' : '[&>code]:break-words'
                            )}
                            language={tab.language}
                            wrapLines={true}
                            hideLineNumbers={tab.hideLineNumbers}
                            handleCopy={() => {
                              copyToClipboard(
                                tab.code({
                                  showKey: true,
                                  functionUrl,
                                  functionName: selectedFunction?.name ?? '',
                                  apiKey,
                                })
                              )
                            }}
                          />
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </PageSectionContent>
          </PageSection>

          {IS_PLATFORM && (
            <>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Develop locally</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
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
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Delete function</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
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
                </PageSectionContent>
              </PageSection>
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
            </>
          )}
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
