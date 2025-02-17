import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Button,
  Label_Shadcn_ as Label,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  TextArea_Shadcn_ as Textarea,
  Input_Shadcn_ as Input,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Badge,
  CodeBlock,
} from 'ui'
import { constructHeaders } from 'data/fetchers'
import { useParams } from 'common'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { getRoleImpersonationJWT } from 'lib/role-impersonation'
import { useGetImpersonatedRole } from 'state/role-impersonation-state'
import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { IS_PLATFORM } from 'lib/constants'
import { prettifyJSON } from 'lib/helpers'
import { Plus, Send, X } from 'lucide-react'

interface EdgeFunctionTesterSheetProps {
  visible: boolean
  onClose: () => void
  url: string
  apiKey: string
}

interface KeyValuePair {
  key: string
  value: string
}

type ResponseData = {
  status: number
  headers: Record<string, string>
  body: string
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const
type HttpMethod = (typeof HTTP_METHODS)[number]

const EdgeFunctionTesterSheet = ({
  visible,
  onClose,
  url,
  apiKey,
}: EdgeFunctionTesterSheetProps) => {
  const { ref: projectRef } = useParams()
  const [method, setMethod] = useState<HttpMethod>('POST')
  const [body, setBody] = useState('{ "name": "Functions" }')
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: '', value: '' }])
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([{ key: '', value: '' }])
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const getImpersonatedRole = useGetImpersonatedRole()
  const { serviceKey } = getAPIKeys(settings)

  const addKeyValuePair = (type: 'headers' | 'queryParams') => {
    if (type === 'headers') {
      setHeaders([...headers, { key: '', value: '' }])
    } else {
      setQueryParams([...queryParams, { key: '', value: '' }])
    }
  }

  const removeKeyValuePair = (index: number, type: 'headers' | 'queryParams') => {
    if (type === 'headers') {
      setHeaders(headers.filter((_, i) => i !== index))
    } else {
      setQueryParams(queryParams.filter((_, i) => i !== index))
    }
  }

  const updateKeyValuePair = (
    index: number,
    field: 'key' | 'value',
    value: string,
    type: 'headers' | 'queryParams'
  ) => {
    if (type === 'headers') {
      const newHeaders = [...headers]
      newHeaders[index][field] = value
      setHeaders(newHeaders)
    } else {
      const newQueryParams = [...queryParams]
      newQueryParams[index][field] = value
      setQueryParams(newQueryParams)
    }
  }

  const sendRequest = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResponse(null)

      let requestBody: any
      try {
        requestBody = JSON.parse(body)
      } catch (e) {
        throw new Error('Invalid JSON in request body')
      }

      let testAuthorization: string | undefined
      const role = getImpersonatedRole()

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
          // Don't throw, fall back to service key
          console.log('Falling back to service key')
        }
      }

      // Construct custom headers
      const customHeaders: Record<string, string> = {}
      headers.forEach(({ key, value }) => {
        if (key && value) {
          customHeaders[key] = value
        }
      })

      // Construct query parameters
      const queryString = queryParams
        .filter(({ key, value }) => key && value)
        .map(({ key, value }) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')

      const finalUrl = queryString ? `${url}?${queryString}` : url

      const defaultHeaders = await constructHeaders()
      const res = await fetch('/api/edge-functions/test', {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: finalUrl,
          method,
          body: requestBody,
          headers: {
            ...(accessToken && {
              Authorization: `Bearer ${accessToken}`,
            }),
            'x-test-authorization': testAuthorization ?? `Bearer ${serviceKey?.api_key}`,
            'Content-Type': 'application/json',
            ...customHeaders,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to test edge function')
      }

      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderKeyValuePairs = (
    type: 'headers' | 'queryParams',
    items: KeyValuePair[],
    label: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-foreground-light text-sm">{label}</Label>
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
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr,1fr,32px] border-b last:border-b-0">
            <Input
              size="tiny"
              placeholder="Enter key..."
              value={item.key}
              onChange={(e) => updateKeyValuePair(index, 'key', e.target.value, type)}
              disabled={isLoading}
              className="h-auto py-2 font-mono rounded-none shadow-none bg-transparent border-l-0 border-r-1 border-t-0 border-b-0 border-border"
            />
            <Input
              size="tiny"
              placeholder="Enter value..."
              value={item.value}
              onChange={(e) => updateKeyValuePair(index, 'value', e.target.value, type)}
              disabled={isLoading}
              className="h-auto py-2 font-mono rounded-none shadow-none bg-transparent border-none"
            />
            <div className="flex items-center justify-center">
              {items.length > 1 && (
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
      <SheetContent size="default" className="flex flex-col gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Test Edge Function</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="space-y-4 p-5">
            <div>
              <Label className="text-foreground-light mb-2 block text-sm">Method</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as HttpMethod)}
                disabled={isLoading}
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
            </div>

            {renderKeyValuePairs('headers', headers, 'Headers')}
            {renderKeyValuePairs('queryParams', queryParams, 'Query Parameters')}

            <div>
              <Label className="text-foreground-light mb-2 block text-sm">Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request body (JSON)"
                rows={3}
                disabled={isLoading}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="h-full bg-surface-100 border-t flex-1 flex flex-col overflow-hidden">
            {response ? (
              <div className="h-full bg-surface-100 flex flex-col overflow-hidden">
                <div className="flex gap-2 items-center p-5 text-sm pb-3">
                  Function responded with
                  <Badge variant={response.status >= 400 ? 'destructive' : 'success'}>
                    {response.status}
                  </Badge>
                </div>
                <Tabs defaultValue="body" className="h-full flex-1 flex flex-col overflow-hidden">
                  <TabsList className="gap-4 px-5">
                    <div className="flex items-center gap-4 flex-1">
                      <TabsTrigger className="text-sm" value="body">
                        Body
                      </TabsTrigger>
                      <TabsTrigger className="text-sm" value="headers">
                        Headers
                      </TabsTrigger>
                    </div>
                  </TabsList>
                  <TabsContent value="body" className="mt-0 px-5 pb-4 flex-1 overflow-auto">
                    <CodeBlock
                      language="json"
                      hideLineNumbers
                      className="rounded-md !border-none !px-4 !py-3 h-full"
                      value={prettifyJSON(response.body)}
                    />
                  </TabsContent>
                  <TabsContent value="headers" className="mt-0 px-4 pb-4 flex-1 overflow-auto">
                    <CodeBlock
                      language="json"
                      hideLineNumbers
                      className="rounded-md !border-none !px-4 !py-3 h-full"
                      value={prettifyJSON(JSON.stringify(response.headers, null, 2))}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : error ? (
              <div className="p-5 space-y-2">
                <Label>Error</Label>
                <p className="text-sm text-foreground-light">{error}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <Send size={24} className="text-foreground-muted" />
                <p className="text-sm text-foreground-light">Send your first test request</p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-5 py-3 border-t">
          <div className="flex items-center gap-2">
            <RoleImpersonationPopover />
            <Button type="primary" onClick={sendRequest} loading={isLoading} disabled={isLoading}>
              Send Request
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default EdgeFunctionTesterSheet
