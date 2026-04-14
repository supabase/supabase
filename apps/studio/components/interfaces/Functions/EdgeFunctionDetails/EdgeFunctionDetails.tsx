import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  copyToClipboard,
  CriticalIcon,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Switch,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import z from 'zod'

import CommandRender from '../CommandRender'
import { INVOCATION_TABS } from './EdgeFunctionDetails.constants'
import { generateCLICommands } from './EdgeFunctionDetails.utils'
import { getKeys, useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useEdgeFunctionDeleteMutation } from '@/data/edge-functions/edge-functions-delete-mutation'
import { useEdgeFunctionUpdateMutation } from '@/data/edge-functions/edge-functions-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

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
  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef, slug: functionSlug })

  const { data: endpoint } = useProjectApiUrl({ projectRef })
  const functionUrl = `${endpoint}/functions/v1/${selectedFunction?.slug}`

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
    <PageContainer size="small">
      <PageSection>
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
                          <Input {...field} className="w-64" disabled={!canUpdateEdgeFunction} />
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
                                <p className="mb-2">
                                  Requires a JWT signed{' '}
                                  <em className="text-foreground not-italic">
                                    only by the legacy secret
                                  </em>{' '}
                                  in the{' '}
                                  <code className="text-code-inline !break-keep">
                                    Authorization
                                  </code>{' '}
                                  header. The <code className="text-code-inline">anon</code> key
                                  satisfies this.
                                </p>
                                <p>
                                  Recommended: OFF with JWT and custom auth logic in your function
                                  code.
                                </p>
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
                    <TabsContent key={tab.id} value={tab.id}>
                      <CodeBlock
                        value={code}
                        wrapperClassName="[&>div]:top-0 [&>div]:right-3 px-6"
                        className={cn(
                          'p-0 text-xs !mt-0 border-none ',
                          showKey ? '[&>code]:break-all' : '[&>code]:break-words'
                        )}
                        language={tab.language}
                        wrapLines={false}
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
                            <span className="text-brand">supabase</span> functions download{' '}
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
    </PageContainer>
  )
}
