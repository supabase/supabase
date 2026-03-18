import { getStatusLevel } from 'components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { RotateCcw, Search } from 'lucide-react'
import {
  Badge,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import { statusBadgeVariant } from './PlatformWebhooksView.utils'

interface DetailItemProps {
  label: string
  children: React.ReactNode
  ddClassName?: string
}

const DetailItem = ({ label, children, ddClassName = 'text-sm' }: DetailItemProps) => (
  <div className="space-y-1">
    <dt className="text-sm text-foreground-lighter">{label}</dt>
    <dd className={ddClassName}>{children}</dd>
  </div>
)

interface PlatformWebhooksEndpointDetailsProps {
  deliverySearch: string
  filteredDeliveries: WebhookDelivery[]
  selectedEndpoint: WebhookEndpoint
  onDeliverySearchChange: (value: string) => void
  onOpenDelivery: (deliveryId: string) => void
  onRetryDelivery: (deliveryId: string) => void
}

export const PlatformWebhooksEndpointDetails = ({
  deliverySearch,
  filteredDeliveries,
  selectedEndpoint,
  onDeliverySearchChange,
  onOpenDelivery,
  onRetryDelivery,
}: PlatformWebhooksEndpointDetailsProps) => {
  const hasCustomHeaders = selectedEndpoint.customHeaders.length > 0

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Overview</h2>
        <Card className="overflow-hidden">
          <CardContent className="pb-5">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <DetailItem label="URL" ddClassName="text-sm break-all">
                {selectedEndpoint.url}
              </DetailItem>

              <DetailItem label="Description">{selectedEndpoint.description || '-'}</DetailItem>

              <DetailItem label="Event types" ddClassName="flex flex-wrap gap-2">
                {(selectedEndpoint.eventTypes.includes('*')
                  ? ['All events (*)']
                  : selectedEndpoint.eventTypes
                ).map((eventType) => (
                  <code
                    key={eventType}
                    className="text-code-inline rounded-md border px-3 py-1.5 text-2xs"
                  >
                    {eventType}
                  </code>
                ))}
              </DetailItem>

              {hasCustomHeaders && (
                <DetailItem label="Custom headers">
                  <div className="rounded-md border divide-y divide-border">
                    {selectedEndpoint.customHeaders.map((header) => (
                      <div
                        key={header.id}
                        className="px-2 py-2 font-mono font-medium text-xs flex items-center gap-2 flex-wrap"
                      >
                        <code className="text-code_block-4">{header.key}:</code>
                        <code className="">{header.value}</code>
                      </div>
                    ))}
                  </div>
                </DetailItem>
              )}

              <DetailItem label="Created by">{selectedEndpoint.createdBy}</DetailItem>

              <DetailItem label="Created at">
                <TimestampInfo className="text-sm" utcTimestamp={selectedEndpoint.createdAt} />
              </DetailItem>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Deliveries</h2>
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Search deliveries"
            size="tiny"
            icon={<Search />}
            value={deliverySearch}
            className="w-full lg:w-52"
            onChange={(event) => onDeliverySearchChange(event.target.value)}
          />
          <p className="text-sm text-foreground-muted">{filteredDeliveries.length} total</p>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Event type</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Attempted</TableHead>
                <TableHead className="w-1">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length > 0 ? (
                filteredDeliveries.map((delivery) => (
                  <TableRow
                    key={delivery.id}
                    className="cursor-pointer inset-focus"
                    onClick={() => onOpenDelivery(delivery.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenDelivery(delivery.id)
                      }
                    }}
                    tabIndex={0}
                  >
                    <TableCell>
                      <Badge variant={statusBadgeVariant[delivery.status]}>{delivery.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-code-inline">{delivery.eventType}</code>
                    </TableCell>
                    <TableCell>
                      {delivery.responseCode ? (
                        <DataTableColumnStatusCode
                          value={delivery.responseCode}
                          level={getStatusLevel(delivery.responseCode)}
                          className="text-xs"
                        />
                      ) : (
                        <span className="text-xs text-foreground-muted">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TimestampInfo className="text-sm" utcTimestamp={delivery.attemptAt} />
                    </TableCell>
                    <TableCell className="w-1 text-right">
                      <div className="flex h-full items-center justify-end">
                        {delivery.status !== 'success' && (
                          <ButtonTooltip
                            type="default"
                            className="w-7 shrink-0 hit-area-2"
                            icon={<RotateCcw size={14} />}
                            aria-label={`Retry ${delivery.id}`}
                            tooltip={{ content: { side: 'top', text: 'Retry' } }}
                            onClick={(event) => {
                              event.stopPropagation()
                              onRetryDelivery(delivery.id)
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          />
                        )}
                        {delivery.status === 'success' && (
                          <span aria-hidden className="size-7 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No deliveries found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
