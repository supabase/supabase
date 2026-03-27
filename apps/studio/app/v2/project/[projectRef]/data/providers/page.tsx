import { DataTableRenderer } from '@/components/v2/DataTableRenderer'

export default function DataProvidersPage() {
  return (
    <DataTableRenderer
      columns={[
        { id: 'provider', name: 'Provider', width: 160 },
        { id: 'enabled', name: 'Enabled', width: 100, type: 'boolean' },
      ]}
      rows={[]}
      rowKey="provider"
      emptyState={{
        title: 'No providers configured',
        description: 'Configure authentication providers in Auth settings.',
      }}
    />
  )
}
