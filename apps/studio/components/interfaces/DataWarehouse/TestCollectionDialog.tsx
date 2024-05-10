import { SelectContent, SelectItem, SelectTrigger, Select } from '@ui/components/shadcn/ui/select'
import { useEffect, useState } from 'react'
import {
  Button,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Input,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export function TestCollectionDialog({
  accessTokens,
  collectionToken,
}: {
  accessTokens: {
    id: string
    token: string
    description?: string
  }[]
  collectionToken: string
}) {
  const [testAccessToken, setTestAccessToken] = useState('')

  useEffect(() => {
    if (accessTokens.length > 0) {
      setTestAccessToken(accessTokens[0].token)
    }
  }, [accessTokens])

  if (accessTokens.length === 0) {
    return <></>
  }

  const selectedAccessToken = accessTokens.find((token) => token.token === testAccessToken)

  return (
    <Dialog>
      <DialogTrigger>
        <Button type="outline">Connect</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send events to this collection</DialogTitle>
          <DialogDescription>
            Use the following curl command to send events to this collection
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4 overflow-auto">
          <FormItemLayout label="Endpoint URL" isReactForm={false}>
            <Input
              copy
              className="font-mono tracking-tighter"
              value={`https://api.logflare.app/logs?source=${collectionToken}`}
            />
          </FormItemLayout>
          <FormItemLayout label="Token" isReactForm={false}>
            <Select value={testAccessToken} onValueChange={setTestAccessToken}>
              <SelectTrigger>
                <span className="text-ellipsis">
                  {selectedAccessToken?.description || 'Access token'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {accessTokens?.map((token: any) => (
                  <SelectItem key={token.id} value={token.token}>
                    {token.description || 'No description'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItemLayout>
          <div>
            <CodeBlock className="p-1 language-bash prose" language="bash">
              {`curl -X "POST" "https://api.logflare.app/logs?source=${collectionToken}" \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-KEY: ${testAccessToken || 'ACCESS_TOKEN'}' \\
  -d $'{
    "event_message": "Test event message",
    "metadata": {
      "ip_address": "100.100.100.100",
      "request_method": "POST",
      "custom_user_data": {
        "foo": "bar"
      },
      "datacenter": "aws",
      "request_headers": {
        "connection": "close",
        "user_agent": "chrome"
      }
    }
  }'
`}
            </CodeBlock>
          </div>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
