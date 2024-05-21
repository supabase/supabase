import { SelectContent, SelectItem, SelectTrigger, Select } from '@ui/components/shadcn/ui/select'
import { WarehouseAccessTokensData, WarehouseCollectionsData } from 'data/analytics'
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
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export function TestCollectionDialog({
  accessTokens,
  collectionToken,
  collections,
  open,
  onOpenChange,
}: {
  accessTokens: WarehouseAccessTokensData['data']
  collections: WarehouseCollectionsData
  collectionToken: string
  projectRef: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const BASE_WAREHOUSE_URL = `https://api.warehouse.tech/api/events`
  const [testAccessToken, setTestAccessToken] = useState('')
  const [selectedCollection, setSelectedCollection] = useState(collectionToken || '')

  useEffect(() => {
    setSelectedCollection(collectionToken)
  }, [collectionToken])

  useEffect(() => {
    if (accessTokens.length > 0) {
      setTestAccessToken(accessTokens[0].token)
    }
  }, [accessTokens])

  const selectedAccessToken = accessTokens.find((token) => token.token === testAccessToken)
  const selectedCollectionName = collections?.find((col) => col.token === selectedCollection)?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <DialogTrigger asChild>
            <Button disabled={accessTokens.length === 0} type="outline">
              Connect
            </Button>
          </DialogTrigger>
        </TooltipTrigger_Shadcn_>
        {accessTokens.length === 0 && (
          <TooltipContent_Shadcn_>
            Create an access token to connect to your collection
          </TooltipContent_Shadcn_>
        )}
      </Tooltip_Shadcn_>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send events to this collection</DialogTitle>
          <DialogDescription>
            Use the following cURL command to send events to this collection
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-4 overflow-auto">
          <div className="flex gap-2 *:flex-1">
            <FormItemLayout label="Collection" isReactForm={false}>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger>
                  <span className="truncate">{selectedCollectionName || 'Collection'}</span>
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {collections?.map((col) => (
                    <SelectItem key={col.id} value={col.token}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItemLayout>
            <FormItemLayout label="Token" isReactForm={false}>
              <Select value={testAccessToken} onValueChange={setTestAccessToken}>
                <SelectTrigger>
                  <span className="truncate">
                    {selectedAccessToken?.description || 'Access token'}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {accessTokens?.map((token: any) => (
                    <SelectItem key={token.id + '-token'} value={token.token}>
                      {token.description || 'No description'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItemLayout>
          </div>

          <FormItemLayout label="Ingest URL" isReactForm={false}>
            <Input
              className="font-mono tracking-tighter"
              value={BASE_WAREHOUSE_URL}
              readOnly
              copy
            />
          </FormItemLayout>

          <CodeBlock className="p-1 language-bash prose" language="bash">
            {`curl -X "POST" "${BASE_WAREHOUSE_URL}?source=${selectedCollection}" \\
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
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
