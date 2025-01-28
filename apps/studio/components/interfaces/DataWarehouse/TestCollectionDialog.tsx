import { Select, SelectContent, SelectItem, SelectTrigger } from '@ui/components/shadcn/ui/select'
import CopyButton from 'components/ui/CopyButton'
import type { WarehouseAccessTokensData } from 'data/analytics/warehouse-access-tokens-query'
import type { WarehouseCollectionsData } from 'data/analytics/warehouse-collections-query'
import { Code } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  CodeBlock,
  DialogSectionSeparator,
  Input_Shadcn_,
  Label_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
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
  onSubmit,
}: {
  accessTokens: WarehouseAccessTokensData['data']
  collections: WarehouseCollectionsData
  collectionToken: string
  projectRef: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  const router = useRouter()
  const BASE_WAREHOUSE_URL = `https://api.warehouse.tech/api/events`
  const [testAccessToken, setTestAccessToken] = useState('')
  const [selectedCollection, setSelectedCollection] = useState(collectionToken || '')
  const [showAccessToken, setShowAccessToken] = useState(false)

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

  function getcURL(accessToken: string) {
    return `curl -X "POST" "${BASE_WAREHOUSE_URL}?source=${selectedCollection}" \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${accessToken}' \\
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
`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <SheetTrigger asChild>
            <Button disabled={accessTokens.length === 0} type="outline">
              Connect
            </Button>
          </SheetTrigger>
        </TooltipTrigger_Shadcn_>
        {accessTokens.length === 0 && (
          <TooltipContent_Shadcn_>
            Create an access token to connect to your collection
          </TooltipContent_Shadcn_>
        )}
      </Tooltip_Shadcn_>

      <SheetContent size="lg" className="h-screen overflow-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Send events to this collection</SheetTitle>
          <SheetDescription>
            Use the following cURL command to send events to this collection
          </SheetDescription>
        </SheetHeader>

        <SheetSection className="flex flex-col gap-4 overflow-auto">
          <FormItemLayout label="Collection" isReactForm={false} layout="horizontal">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger size="tiny">
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
          <FormItemLayout label="Token" isReactForm={false} layout="horizontal">
            <Select value={testAccessToken} onValueChange={setTestAccessToken}>
              <SelectTrigger size="tiny">
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

          <FormItemLayout layout="horizontal" label="Ingest API URL" isReactForm={false}>
            <Input_Shadcn_ size="tiny" className="font-mono" value={BASE_WAREHOUSE_URL} readOnly />
          </FormItemLayout>
          <FormItemLayout layout="horizontal" label="Collection ID" isReactForm={false}>
            <Input_Shadcn_ size="tiny" className="font-mono" value={selectedCollection} readOnly />
          </FormItemLayout>
        </SheetSection>

        <Separator />

        <SheetSection className="flex-1">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Checkbox_Shadcn_
                name="showAccessToken"
                id="showAccessToken"
                checked={showAccessToken}
                onCheckedChange={() => setShowAccessToken(!showAccessToken)}
              />
              <Label_Shadcn_ htmlFor="showAccessToken">Show access token</Label_Shadcn_>
            </div>
            <CopyButton type="default" text={getcURL(testAccessToken)} />
          </div>

          <div className="mt-4 relative">
            <CodeBlock
              hideCopy
              className={'p-1 language-bash prose max-w-full transition-colors'}
              language="bash"
            >
              {getcURL(showAccessToken ? testAccessToken : '********************')}
            </CodeBlock>
          </div>
        </SheetSection>

        <SheetFooter className="mt-auto">
          <p className="text-sm text-foreground-light mr-auto">
            Once you send an event, refresh the page to see it in the collection.
          </p>
          <div className="flex justify-end">
            <Button onClick={onSubmit}>Refresh results</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
