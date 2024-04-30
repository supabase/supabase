import { SelectContent, SelectItem, SelectTrigger, Select } from '@ui/components/shadcn/ui/select'
import { useState } from 'react'
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
              {testAccessToken.slice(0, 8) + '...' || 'Access token'}
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
"event_message": "This is another log message.",
"metadata": {
"ip_address": "100.100.100.100",
"request_method": "POST",
"custom_user_data": {
"vip": true,
"id": 38,
"login_count": 154,
"company": "Supabase",
"address": {
"zip": "11111",
"st": "NY",
"street": "123 W Main St",
"city": "New York"
}
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
