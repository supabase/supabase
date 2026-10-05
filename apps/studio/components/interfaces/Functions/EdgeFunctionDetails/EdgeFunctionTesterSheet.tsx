import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { BookOpen, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  Badge,
  Button,
  Form,
  FormControl,
  FormField,
  Label,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { KeyValueFieldArray } from 'ui-patterns/form/KeyValueFieldArray/KeyValueFieldArray'
import * as z from 'zod'

import { HTTP_METHODS } from './EdgeFunctionDetails.constants'
import { ErrorWithStatus, ResponseData } from './EdgeFunctionDetails.types'
import { getEdgeFunctionErrorDocs } from './EdgeFunctionDetails.utils'
import { buildEdgeFunctionTestHeaders } from './EdgeFunctionTesterSheet.utils'
import { buildEdgeFunctionHeaderAddActions } from '@/components/interfaces/Functions/httpHeaderAddActions'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useEdgeFunctionTestMutation } from '@/data/edge-functions/edge-function-test-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { prettifyJSON } from '@/lib/helpers'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

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
  const { ref: projectRef, functionSlug } = useParams()

  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorDocs = response ? getEdgeFunctionErrorDocs(response.headers) : undefined

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { anonKey, publishableKey, secretKey, serviceKey } = apiKeysData ?? {}
  const { data: settings } = useProjectSettingsV2Query({ projectRef })

  // Sent on the `apikey` header. Defaults to the least privileged key available, matching what the
  // function details page shows in its example snippets.
  const clientApiKey = publishableKey?.api_key ?? anonKey?.api_key
  const secretApiKey = secretKey?.api_key ?? serviceKey?.api_key

  // Both keys are offered so the user can swap the request's credential without looking one up.
  // The webhook specific action the helper also builds is not relevant here.
  const headerAddActions = buildEdgeFunctionHeaderAddActions({
    apiKey: secretApiKey ?? '[YOUR API KEY]',
    publishableKey: clientApiKey,
    createRow: (key: string, value: string) => ({ key, value }),
  }).filter(({ key }) => key !== 'add-source-header')

  const track = useTrack()
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
  const method = useWatch({ control: form.control, name: 'method' })

  useShortcut(
    SHORTCUT_IDS.FUNCTION_DETAIL_SUBMIT_TEST,
    () => {
      form.handleSubmit(onSubmit)()
    },
    { enabled: visible && !isPending }
  )

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
      headers: buildEdgeFunctionTestHeaders({
        apiKey: clientApiKey,
        customHeaders: values.headers,
      }),
    })
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent
        size="default"
        hasOverlay={false}
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto flex flex-col"
          >
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel>
                <div className="flex flex-col gap-y-4 p-5 h-full overflow-y-auto">
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical" label="HTTP Method">
                        <FormControl>
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
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  {method !== 'GET' && (
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItemLayout layout="vertical" label="Request Body">
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Request body (JSON)"
                              rows={3}
                              disabled={isPending}
                              className="font-mono text-xs"
                            />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  )}

                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Headers</Label>
                    <KeyValueFieldArray
                      control={form.control}
                      name="headers"
                      keyFieldName="key"
                      valueFieldName="value"
                      createEmptyRow={() => ({ key: '', value: '' })}
                      keyPlaceholder="Header name"
                      valuePlaceholder="Header value"
                      addLabel="Add header"
                      addActions={headerAddActions}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Query Parameters</Label>
                    <KeyValueFieldArray
                      control={form.control}
                      name="queryParams"
                      keyFieldName="key"
                      valueFieldName="value"
                      createEmptyRow={() => ({ key: '', value: '' })}
                      keyPlaceholder="Parameter name"
                      valuePlaceholder="Parameter value"
                      addLabel="Add parameter"
                      disabled={isPending}
                    />
                  </div>
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
                            <div className="-translate-y-1 flex items-center gap-2">
                              {errorDocs !== undefined && (
                                <Button
                                  asChild
                                  variant="text"
                                  size="tiny"
                                  icon={<BookOpen size={14} />}
                                >
                                  <a
                                    href={errorDocs.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`View documentation for ${errorDocs.code} (opens in new tab)`}
                                  >
                                    Error docs
                                  </a>
                                </Button>
                              )}
                              <Badge variant={response.status >= 400 ? 'destructive' : 'success'}>
                                {response.status}
                              </Badge>
                            </div>
                          </TabsList>
                          <TabsContent value="body" className="mt-0 flex-1 overflow-auto p-0">
                            <CodeBlock
                              language="json"
                              hideLineNumbers
                              className="rounded-md border-none! px-4! py-3! h-full"
                              value={prettifyJSON(response.body)}
                            />
                          </TabsContent>
                          <TabsContent value="headers" className="mt-0 flex-1 overflow-auto p-0">
                            <CodeBlock
                              language="json"
                              hideLineNumbers
                              className="rounded-md border-none! px-4! py-3! h-full"
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
                <ShortcutTooltip shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_SUBMIT_TEST} side="top">
                  <Button
                    variant="primary"
                    type="submit"
                    loading={isPending}
                    disabled={isPending}
                    onClick={() =>
                      track('edge_function_test_send_button_clicked', { httpMethod: method })
                    }
                  >
                    Send Request
                  </Button>
                </ShortcutTooltip>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
