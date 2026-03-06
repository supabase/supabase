import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useEdgeFunctionTestMutation } from 'data/edge-functions/edge-function-test-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { prettifyJSON } from 'lib/helpers'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { Loader2, Plus, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
  RoleImpersonationStateContextProvider,
  useGetImpersonatedRoleState,
} from 'state/role-impersonation-state'
import {
  Badge,
  Button,
  CodeBlock,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  TextArea_Shadcn_ as Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { HTTP_METHODS } from './EdgeFunctionDetails.constants'
import { ErrorWithStatus, ResponseData } from './EdgeFunctionDetails.types'

interface EdgeFunctionTesterSheetProps {
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  method: z.enum(HTTP_METHODS),
  body: z
    .string()
    .optional()
    .transform((str) => str || '{}'),
  headers: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
  queryParams: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
})

type FormValues = z.infer<typeof FormSchema>

export const EdgeFunctionTesterSheet = ({ visible, onClose }: EdgeFunctionTesterSheetProps) => {
  const { data: org } = useSelectedOrganizationQuery()
  const { ref: projectRef, functionSlug } = useParams()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { serviceKey } = getKeys(apiKeys)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: testEdgeFunction, isPending } = useEdgeFunctionTestMutation({
    onSuccess: (res) => setResponse(res),
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      if (err instanceof Error) {
        const errorWithStatus = err as ErrorWithStatus
        setResponse({
          status: errorWithStatus.cause?.status || 500,
          headers: {},
          body: '',
        })
      }
    },
  })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const url = `${protocol}://${endpoint}/functions/v1/${functionSlug}`

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      method: 'POST',
      body: '{ "name": "Functions" }',
      headers: [{ key: '', value: '' }],
      queryParams: [{ key: '', value: '' }],
    },
  })
  const { method } = form.watch()

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: 'headers',
  })

  const {
    fields: queryParamFields,
    append: appendQueryParam,
    remove: removeQueryParam,
  } = useFieldArray({
    control: form.control,
    name: 'queryParams',
  })

  const addKeyValuePair = (type: 'headers' | 'queryParams') => {
    if (type === 'headers') {
      appendHeader({ key: '', value: '' })
    } else {
      appendQueryParam({ key: '', value: '' })
    }
  }

  const removeKeyValuePair = (index: number, type: 'headers' | 'queryParams') => {
    if (type === 'headers') {
      removeHeader(index)
    } else {
      removeQueryParam(index)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setResponse(null)

    // Validate that the body is valid JSON
    try {
      JSON.parse(JSON.stringify(values.body))
    } catch (e) {
      form.setError('body', { message: 'Must be a valid JSON string' })
      return
    }

    let testAuthorization: string | undefined
    const role = getImpersonatedRoleState().role

    if (
      projectRef !== undefined &&
      config?.jwt_secret !== undefined &&
      role !== undefined &&
      role.type === 'postgrest'
    ) {
      try {
        const token = await getRoleImpersonationJWT(projectRef, config.jwt_secret, role)
        testAuthorization = 'Bearer ' + token
      } catch (err: any) {
        console.error('Failed to generate JWT:', {
          error: err.message,
          roleDetails: role,
        })
      }
    }

    // Construct custom headers
    const customHeaders: Record<string, string> = {}
    values.headers.forEach(({ key, value }) => {
      if (key && value) {
        customHeaders[key] = value
      }
    })

    // Construct query parameters
    const queryString = values.queryParams
      .filter(({ key, value }) => key && value)
      .map(({ key, value }) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    const finalUrl = queryString ? `${url}?${queryString}` : url

    testEdgeFunction({
      url: finalUrl,
      method: values.method,
      body: values.body,
      headers: {
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
        'x-test-authorization': testAuthorization ?? `Bearer ${serviceKey?.api_key}`,
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    })
  }

  const renderKeyValuePairs = (type: 'headers' | 'queryParams', label: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-foreground text-sm">{label}</Label>
        <Button
          type="default"
          size="tiny"
          icon={<Plus size={14} />}
          onClick={() => addKeyValuePair(type)}
        >
          Add {label}
        </Button>
      </div>
      <div className="border rounded-md bg-surface-200">
        {(type === 'headers' ? headerFields : queryParamFields).map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr,1fr,32px] border-b last:border-b-0">
            <FormField_Shadcn_
              control={form.control}
              name={`${type}.${index}.key`}
              render={({ field }) => (
                <FormControl_Shadcn_>
                  <Input
                    {...field}
                    size="tiny"
                    placeholder="Enter key..."
                    disabled={isPending}
                    className="h-auto py-2 font-mono rounded-none shadow-none bg-transparent border-l-0 border-r-1 border-t-0 border-b-0 border-border"
                  />
                </FormControl_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name={`${type}.${index}.value`}
              render={({ field }) => (
                <FormControl_Shadcn_>
                  <Input
                    {...field}
                    size="tiny"
                    placeholder="Enter value..."
                    disabled={isPending}
                    className="h-auto py-2 font-mono rounded-none shadow-none bg-transparent border-none"
                  />
                </FormControl_Shadcn_>
              )}
            />
            <div className="flex items-center justify-center">
              {(type === 'headers' ? headerFields : queryParamFields).length > 1 && (
                <Button
                  type="text"
                  size="tiny"
                  icon={<X strokeWidth={1.5} size={14} />}
                  className="w-6 h-6"
                  onClick={() => removeKeyValuePair(index, type)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent
        size="default"
        className="flex flex-col gap-0 p-0"
        onPointerDownOutside={(e) => {
          // react-resizable-panels v4 registers document-level capture-phase pointer
          // handlers that can interfere with Radix Dialog's outside-interaction detection.
          // Prevent the sheet from closing when interacting with the resize handle.
          const target = (e as CustomEvent<{ originalEvent: PointerEvent }>).detail?.originalEvent
            ?.target as HTMLElement | null
          if (target?.closest?.('[data-separator]')) {
            e.preventDefault()
          }
        }}
        onFocusOutside={(e) => {
          // The v4 Separator explicitly calls .focus() on itself during pointerdown,
          // which can trigger Radix Dialog's focus-outside detection.
          const target = e.target as HTMLElement | null
          if (target?.closest?.('[data-separator]')) {
            e.preventDefault()
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>Test {functionSlug}</SheetTitle>
        </SheetHeader>

        <Form_Shadcn_ {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto flex flex-col"
          >
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel>
                <div className="flex flex-col gap-y-4 p-5 h-full overflow-y-auto">
                  <FormField_Shadcn_
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical" label="HTTP Method">
                        <FormControl_Shadcn_>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              {HTTP_METHODS.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  {method !== 'GET' && (
                    <FormField_Shadcn_
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItemLayout layout="vertical" label="Request Body">
                          <FormControl_Shadcn_>
                            <Textarea
                              {...field}
                              placeholder="Request body (JSON)"
                              rows={3}
                              disabled={isPending}
                              className="font-mono text-xs"
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  )}

                  {renderKeyValuePairs('headers', 'Headers')}
                  {renderKeyValuePairs('queryParams', 'Query Parameters')}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="41" minSize="41" maxSize="83">
                <div className="h-full bg-surface-100 border-t flex-1 flex flex-col overflow-hidden">
                  {response ? (
                    <div className="h-full bg-surface-100 flex flex-col overflow-hidden">
                      {error ? (
                        <>
                          <div className="flex gap-2 items-center p-5 text-sm pb-3">
                            Function responded with
                            <Badge variant={response.status >= 400 ? 'destructive' : 'success'}>
                              {response.status}
                            </Badge>
                          </div>
                          <p className="px-5 text-sm text-foreground-light">{error}</p>
                        </>
                      ) : (
                        <Tabs
                          defaultValue="body"
                          className="h-full flex-1 flex flex-col overflow-hidden"
                        >
                          <TabsList className="gap-4 px-5 pt-2">
                            <div className="flex items-center gap-4 flex-1">
                              <TabsTrigger className="text-sm" value="body">
                                Body
                              </TabsTrigger>
                              <TabsTrigger className="text-sm" value="headers">
                                Headers
                              </TabsTrigger>
                            </div>
                            <Badge
                              variant={response.status >= 400 ? 'destructive' : 'success'}
                              className="-translate-y-1"
                            >
                              {response.status}
                            </Badge>
                          </TabsList>
                          <TabsContent value="body" className="mt-0 flex-1 overflow-auto p-0">
                            <CodeBlock
                              language="json"
                              hideLineNumbers
                              className="rounded-md !border-none !px-4 !py-3 h-full"
                              value={prettifyJSON(response.body)}
                            />
                          </TabsContent>
                          <TabsContent value="headers" className="mt-0 flex-1 overflow-auto p-0">
                            <CodeBlock
                              language="json"
                              hideLineNumbers
                              className="rounded-md !border-none !px-4 !py-3 h-full"
                              value={prettifyJSON(JSON.stringify(response.headers, null, 2))}
                            />
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  ) : isPending ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="text-foreground-muted animate-spin" />
                      <p className="text-sm text-foreground-light">Sending request...</p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <Send size={24} className="text-foreground-muted" />
                      <p className="text-sm text-foreground-light">Send your first test request</p>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>

            <SheetFooter className="px-5 py-3 border-t">
              <div className="flex items-center gap-2">
                {/* [Alaister]: We're using a fresh context here as edge functions don't allow impersonating users. */}
                <RoleImpersonationStateContextProvider
                  key={`role-impersonation-state-${projectRef}`}
                >
                  <RoleImpersonationPopover disallowAuthenticatedOption />
                </RoleImpersonationStateContextProvider>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isPending}
                  disabled={isPending}
                  onClick={() =>
                    sendEvent({
                      action: 'edge_function_test_send_button_clicked',
                      properties: {
                        httpMethod: method,
                      },
                      groups: {
                        project: projectRef ?? 'Unknown',
                        organization: org?.slug ?? 'Unknown',
                      },
                    })
                  }
                >
                  Send Request
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}
