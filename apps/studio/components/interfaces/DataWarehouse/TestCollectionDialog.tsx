import { SelectContent, SelectItem, SelectTrigger, Select } from '@ui/components/shadcn/ui/select'
import { useEffect, useState } from 'react'
import { Button, CodeBlock, Dialog, DialogContent, DialogTrigger, Input } from 'ui'

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
  }, [])

  if (accessTokens.length === 0) {
    return <></>
  }

  const selectedAccessToken = accessTokens.find((token) => token.token === testAccessToken)

  return (
    <Dialog>
      <DialogTrigger>
        <Button type="outline">Connect</Button>
      </DialogTrigger>
      <DialogContent className="p-3">
        <h2>Send events to this collection using the following endpoint</h2>
        <Input
          copy
          className="font-mono tracking-tighter"
          value={`https://api.logflare.app/logs?source=${collectionToken}`}
        />
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
        <CodeBlock language="bash" className="language-bash prose dark:prose-dark max-">
          {`
  curl -X "POST" "https://api.logflare.app/logs?source=${collectionToken}" \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-KEY: ${testAccessToken || 'ACCESS_TOKEN'}' \\
  -d $'{
    "event_message": "Hello world",
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
      </DialogContent>
    </Dialog>
  )
}
