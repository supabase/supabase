import { DataTableRenderer } from '@/components/v2/DataTableRenderer'

export default function DataChannelsPage() {
  return (
    <DataTableRenderer
      columns={[
        { id: 'name', name: 'Channel', width: 240 },
        { id: 'inserted_at', name: 'Created', width: 160, type: 'datetime' },
      ]}
      rows={[]}
      rowKey="id"
      emptyState={{
        title: 'No Realtime channels',
        description: 'Channels that clients subscribe to will appear here.',
      }}
    />
  )
}
