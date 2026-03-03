import { Search } from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'
import { formatDate, formatEvents, statusBadgeVariant } from './PlatformWebhooksView.utils'

interface PlatformWebhooksEndpointDetailsProps {
  deliverySearch: string
  filteredDeliveries: WebhookDelivery[]
  selectedEndpoint: WebhookEndpoint
  onDeliverySearchChange: (value: string) => void
  onOpenDelivery: (deliveryId: string) => void
  onRegenerateSecret: () => void
}

export const PlatformWebhooksEndpointDetails = ({
  deliverySearch,
  filteredDeliveries,
  selectedEndpoint,
  onDeliverySearchChange,
  onOpenDelivery,
  onRegenerateSecret,
}: PlatformWebhooksEndpointDetailsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-44">URL</TableHead>
                <TableCell>{selectedEndpoint.url}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableCell>{selectedEndpoint.description || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Event types</TableHead>
                <TableCell>{formatEvents(selectedEndpoint.eventTypes)}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Custom headers</TableHead>
                <TableCell>
                  {selectedEndpoint.customHeaders.length === 0
                    ? '-'
                    : selectedEndpoint.customHeaders.map((header) => (
                      <div key={header.id}>
                        <code className="text-code-inline">{header.key}</code>: {header.value}
                      </div>
                    ))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Created by</TableHead>
                <TableCell>{selectedEndpoint.createdBy}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Created at</TableHead>
                <TableCell>{formatDate(selectedEndpoint.createdAt)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signing secret</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground-light">
              Signing secrets are shown only when they are first created or regenerated. Store the
              secret securely when shown.
            </p>
            <div>
              <Button type="warning" onClick={onRegenerateSecret}>
                Regenerate secret
              </Button>
            </div>
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
                    <TableCell>{delivery.eventType}</TableCell>
                    <TableCell>{delivery.responseCode ?? '-'}</TableCell>
                    <TableCell>{formatDate(delivery.attemptAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>No deliveries found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
