'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label_Shadcn_ as Label,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  TextArea_Shadcn_ as Textarea,
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
import {
  RoleImpersonationPopover,
  RoleImpersonationSelector,
} from 'components/interfaces/RoleImpersonationSelector'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { IS_PLATFORM } from 'lib/constants'
import { prettifyJSON } from 'lib/helpers'

type ResponseData = {
  status: number
  headers: Record<string, string>
  body: string
}

interface EdgeFunctionTesterProps {
  url: string
  anonKey: string
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const
type HttpMethod = (typeof HTTP_METHODS)[number]

export default function EdgeFunctionTester({ url, anonKey }: EdgeFunctionTesterProps) {
  const { ref: projectRef } = useParams()
  const [method, setMethod] = useState<HttpMethod>('POST')
  const [body, setBody] = useState('{ "name": "Functions" }')
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const getImpersonatedRole = useGetImpersonatedRole()
  const { serviceKey } = getAPIKeys(settings)

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

      console.log('Role impersonation details:', {
        role,
        projectRef,
        hasJwtSecret: !!config?.jwt_secret,
        hasServiceKey: !!serviceKey?.api_key,
        hasAccessToken: !!accessToken,
      })

      if (
        projectRef !== undefined &&
        config?.jwt_secret !== undefined &&
        role !== undefined &&
        role.type === 'postgrest'
      ) {
        try {
          console.log('Generating JWT for role:', {
            roleDetails: role,
            type: role.type,
          })

          const token = await getRoleImpersonationJWT(projectRef, config.jwt_secret, role)
          testAuthorization = 'Bearer ' + token
          console.log('Successfully generated JWT token for role')
        } catch (err: any) {
          console.error('Failed to generate JWT:', {
            error: err.message,
            roleDetails: role,
          })
          // Don't throw, fall back to service key
          console.log('Falling back to service key')
        }
      }

      console.log('serviceKey', serviceKey)

      const headers = await constructHeaders()
      const res = await fetch('/api/edge-functions/test', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method,
          body: requestBody,
          headers: {
            ...(accessToken && {
              Authorization: `Bearer ${accessToken}`,
            }),
            'x-test-authorization': testAuthorization ?? `Bearer ${serviceKey?.api_key}`,
            'Content-Type': 'application/json',
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

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label className="text-foreground-light mb-2 block text-xs">Method</Label>
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

        <div>
          <Label className="text-foreground-light mb-2 block text-xs">Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Request body (JSON)"
            rows={3}
            disabled={isLoading}
            className="font-mono text-xs"
          />
        </div>
        <div className="flex justify-end gap-2">
          <RoleImpersonationPopover />
          <Button type="primary" onClick={sendRequest} loading={isLoading} disabled={isLoading}>
            Send Request
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 space-y-2">
          <Label>Error</Label>
          <p className="text-sm text-foreground-light">{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-4 bg-surface-100 border-t -mx-4 -mb-4">
          <Tabs defaultValue="body" className="w-full gap-0">
            <TabsList className="gap-4 pt-2 px-4">
              <div className="flex items-center gap-4 flex-1">
                <TabsTrigger className="text-xs" value="body">
                  Body
                </TabsTrigger>
                <TabsTrigger className="text-xs" value="headers">
                  Headers
                </TabsTrigger>
              </div>
              <Badge variant={response.status >= 400 ? 'destructive' : 'success'}>
                {response.status}
              </Badge>
            </TabsList>
            <TabsContent value="body" className="mt-0">
              <CodeBlock
                language="json"
                hideLineNumbers
                className="rounded-md !border-none !px-4 !py-3 max-h-32"
                value={prettifyJSON(response.body)}
              />
            </TabsContent>
            <TabsContent value="headers" className="mt-0">
              <CodeBlock
                language="json"
                hideLineNumbers
                className="rounded-md !border-none !px-4 !py-3 max-h-32"
                value={prettifyJSON(JSON.stringify(response.headers, null, 2))}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  )
}
