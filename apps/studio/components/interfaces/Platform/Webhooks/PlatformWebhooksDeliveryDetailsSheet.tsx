import { Copy, RotateCcw } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { WebhookDelivery } from './PlatformWebhooks.types'
import { formatDeliveryStatus, statusBadgeVariant } from './PlatformWebhooksView.utils'
import { getStatusLevel } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { Shortcut } from '@/components/ui/Shortcut'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface PlatformWebhooksDeliveryDetailsSheetProps {
  deliveryAttempt: number | null
  deliveryDetailsTab: 'event' | 'response'
  deliveryEventPayload: string
  deliveryResponsePayload: string
  open: boolean
  selectedDelivery: WebhookDelivery | null
  onCopy: (value: string, label: string) => void
  onOpenChange: (open: boolean) => void
  onRetryDelivery: (deliveryId: string) => void
  onTabChange: (tab: 'event' | 'response') => void
}

export const PlatformWebhooksDeliveryDetailsSheet = ({
  deliveryAttempt,
  deliveryDetailsTab,
  deliveryEventPayload,
  deliveryResponsePayload,
  open,
  selectedDelivery,
  onCopy,
  onOpenChange,
  onRetryDelivery,
  onTabChange,
}: PlatformWebhooksDeliveryDetailsSheetProps) => {
  const retryableDelivery =
    selectedDelivery && selectedDelivery.status !== 'success' ? selectedDelivery : null

  const activePayload =
    deliveryDetailsTab === 'event' ? deliveryEventPayload : deliveryResponsePayload
  const activePayloadLabel = deliveryDetailsTab === 'event' ? 'event payload' : 'response payload'
  const copyPayloadShortcutLabel =
    deliveryDetailsTab === 'event' ? 'Copy event payload' : 'Copy response payload'

  useShortcut(
    SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_PAYLOAD,
    () => onCopy(activePayload, activePayloadLabel),
    { enabled: open, label: copyPayloadShortcutLabel }
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="default" className="flex flex-col gap-0">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>Delivery details</SheetTitle>
            {selectedDelivery && (
              <Badge variant={statusBadgeVariant[selectedDelivery.status]}>
                {formatDeliveryStatus(selectedDelivery.status)}
              </Badge>
            )}
          </div>
        </SheetHeader>
        <Separator />

        {selectedDelivery && (
          <SheetSection className="overflow-auto grow px-0 py-0">
            <div className="space-y-6 p-5">
              <Card>
                <CardContent className="grid grid-cols-1 gap-4 p-4 @md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Delivery ID</p>
                    <code className="text-code-inline">{selectedDelivery.id}</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Attempt</p>
                    <p className="text-sm text-foreground">
                      {deliveryAttempt ? `#${deliveryAttempt}` : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Timestamp</p>
                    <TimestampInfo className="text-sm" utcTimestamp={selectedDelivery.attemptAt} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Response code</p>
                    {selectedDelivery.responseCode ? (
                      <DataTableColumnStatusCode
                        value={selectedDelivery.responseCode}
                        level={getStatusLevel(selectedDelivery.responseCode)}
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-xs text-foreground-muted">–</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs
                value={deliveryDetailsTab}
                onValueChange={(value) => onTabChange(value as 'event' | 'response')}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="event" className="flex-1">
                    Event
                  </TabsTrigger>
                  <TabsTrigger value="response" className="flex-1">
                    Response
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="event" className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Event type</p>
                    <code className="text-code-inline">{selectedDelivery.eventType}</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Event ID</p>
                    <code className="text-code-inline">{selectedDelivery.id}</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Event timestamp</p>
                    <TimestampInfo className="text-sm" utcTimestamp={selectedDelivery.attemptAt} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-foreground-light">Payload</p>
                      <ShortcutTooltip
                        shortcutId={SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_PAYLOAD}
                        label="Copy event payload"
                      >
                        <Button
                          variant="text"
                          icon={<Copy size={14} />}
                          onClick={() => onCopy(deliveryEventPayload, 'event payload')}
                        >
                          Copy
                        </Button>
                      </ShortcutTooltip>
                    </div>
                    <div className="rounded-md border border-default bg-surface-200 p-3">
                      <pre className="whitespace-pre-wrap text-xs text-foreground">
                        {deliveryEventPayload}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="response" className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Status</p>
                    <Badge variant={statusBadgeVariant[selectedDelivery.status]}>
                      {formatDeliveryStatus(selectedDelivery.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground-light">Response code</p>
                    {selectedDelivery.responseCode ? (
                      <DataTableColumnStatusCode
                        value={selectedDelivery.responseCode}
                        level={getStatusLevel(selectedDelivery.responseCode)}
                        className="text-xs"
                      />
                    ) : (
                      <span className="text-xs text-foreground-muted">–</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-foreground-light">Response payload</p>
                      <ShortcutTooltip
                        shortcutId={SHORTCUT_IDS.PLATFORM_WEBHOOKS_COPY_PAYLOAD}
                        label="Copy response payload"
                      >
                        <Button
                          variant="text"
                          icon={<Copy size={14} />}
                          onClick={() => onCopy(deliveryResponsePayload, 'response payload')}
                        >
                          Copy
                        </Button>
                      </ShortcutTooltip>
                    </div>
                    <div className="rounded-md border border-default bg-surface-200 p-3">
                      <pre className="whitespace-pre-wrap text-xs text-foreground">
                        {deliveryResponsePayload}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </SheetSection>
        )}

        {retryableDelivery && (
          <SheetFooter className="shrink-0">
            <Shortcut
              id={SHORTCUT_IDS.PLATFORM_WEBHOOKS_RETRY_DELIVERY}
              onTrigger={() => onRetryDelivery(retryableDelivery.id)}
            >
              <Button
                variant="default"
                icon={<RotateCcw />}
                onClick={() => onRetryDelivery(retryableDelivery.id)}
              >
                Retry delivery
              </Button>
            </Shortcut>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
