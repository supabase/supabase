import { Search } from 'lucide-react'

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
import { formatDate, statusBadgeVariant } from './PlatformWebhooksView.utils'

interface PlatformWebhooksEndpointDetailsProps {
  deliverySearch: string
  filteredDeliveries: WebhookDelivery[]
  selectedEndpoint: WebhookEndpoint
  onDeliverySearchChange: (value: string) => void
  onOpenDelivery: (deliveryId: string) => void
}

export const PlatformWebhooksEndpointDetails = ({
  deliverySearch,
  filteredDeliveries,
  selectedEndpoint,
  onDeliverySearchChange,
  onOpenDelivery,
}: PlatformWebhooksEndpointDetailsProps) => {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h2 className="text-foreground text-xl">Overview</h2>
        <Card className="overflow-hidden">
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm text-foreground-lighter">URL</dt>
                <dd className="text-sm break-all">{selectedEndpoint.url}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-foreground-lighter">Description</dt>
                <dd className="text-sm">{selectedEndpoint.description || '-'}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-foreground-lighter">Event types</dt>
                <dd className="flex flex-wrap gap-2">
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
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-foreground-lighter">Custom headers</dt>
                <dd className="text-sm">
                  {selectedEndpoint.customHeaders.length === 0
                    ? '-'
                    : (
                      <div className="rounded-md border divide-y">
                        {selectedEndpoint.customHeaders.map((header) => (
                          <div key={header.id} className="px-3 py-3 font-mono font-medium text-xs flex items-center gap-2 flex-wrap">
                            <code className="text-code_block-4">{header.key}:</code>

                            <code className="">{header.value}</code>
                          </div>
                        ))}
                      </div>
                    )}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-foreground-lighter">Created by</dt>
                <dd className="text-sm">{selectedEndpoint.createdBy}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-sm text-foreground-lighter">Created at</dt>
                <dd className="text-sm">
                  <TimestampInfo className="text-sm" utcTimestamp={selectedEndpoint.createdAt} />
                </dd>
              </div>
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
                <TableHead>Attempt at</TableHead>
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
                      <code className="text-code-inline">
                        {delivery.eventType}
                      </code>
                    </TableCell>
                    <TableCell>{delivery.responseCode ?? '-'}</TableCell>
                    <TableCell>{formatDate(delivery.attemptAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>No deliveries found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
