import { DataTableRenderer } from '@/components/v2/DataTableRenderer'

export default function DataOAuthAppsPage() {
  return (
    <DataTableRenderer
      columns={[
        { id: 'name', name: 'App name', width: 240 },
        { id: 'website', name: 'Website', width: 200 },
        { id: 'created_at', name: 'Created', width: 160, type: 'datetime' },
      ]}
      rows={[]}
      rowKey="id"
      emptyState={{
        title: 'No OAuth apps',
        description: 'Third-party OAuth applications will appear here.',
      }}
    />
  )
}
