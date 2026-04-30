import dayjs from 'dayjs'
import { Input, SidePanel } from 'ui'

import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import {
  TIMESTAMP_MICROS_PER_MS,
  type V2AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

interface LogDetailsPanelProps {
  selectedLog?: V2AuditLog
  onClose: () => void
}

export const LogDetailsPanel = ({ selectedLog, onClose }: LogDetailsPanelProps) => {
  const timestamp = selectedLog
    ? dayjs(selectedLog.timestamp / TIMESTAMP_MICROS_PER_MS).format('DD MMM YYYY, HH:mm:ss')
    : ''
  const timestampWithTz = selectedLog
    ? dayjs(selectedLog.timestamp / TIMESTAMP_MICROS_PER_MS).format('DD MMM YYYY, HH:mm:ss (ZZ)')
    : ''

  return (
    <SidePanel
      size="large"
      header={selectedLog ? `"${selectedLog.action.name}" on ${timestamp}` : ''}
      visible={selectedLog !== undefined}
      onCancel={onClose}
      cancelText="Close"
    >
      <FormSection header={<FormSectionLabel>General</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input
            readOnly
            size="small"
            label="Occurred at"
            value={
              selectedLog
                ? dayjs(selectedLog.timestamp / TIMESTAMP_MICROS_PER_MS).toISOString()
                : ''
            }
            descriptionText={timestampWithTz}
          />
          <Input readOnly size="small" label="Request ID" value={selectedLog?.request_id ?? ''} />
          {selectedLog?.organization_slug && (
            <Input
              readOnly
              size="small"
              label="Organization"
              value={selectedLog.organization_slug}
            />
          )}
          {selectedLog?.project_ref && (
            <Input readOnly size="small" label="Project ref" value={selectedLog.project_ref} />
          )}
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Actor</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input
            readOnly
            size="small"
            label="Token type"
            value={selectedLog?.actor.token_type ?? ''}
          />
          {selectedLog?.actor.email && (
            <Input readOnly size="small" label="Email" value={selectedLog.actor.email} />
          )}
          {selectedLog?.actor.user_id && (
            <Input readOnly size="small" label="User ID" value={selectedLog.actor.user_id} />
          )}
          {selectedLog?.actor.ip && (
            <Input readOnly size="small" label="IP address" value={selectedLog.actor.ip} />
          )}
          {selectedLog?.actor.oauth_app_name && (
            <Input
              readOnly
              size="small"
              label="OAuth app"
              value={selectedLog.actor.oauth_app_name}
            />
          )}
          {selectedLog?.actor.app_name && (
            <Input readOnly size="small" label="App" value={selectedLog.actor.app_name} />
          )}
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Action</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input readOnly size="small" label="Name" value={selectedLog?.action.name ?? ''} />
          <Input readOnly size="small" label="Method" value={selectedLog?.action.method ?? ''} />
          <Input readOnly size="small" label="Route" value={selectedLog?.action.route ?? ''} />
          <Input
            readOnly
            size="small"
            label="Status"
            value={String(selectedLog?.action.status ?? '')}
          />
          {selectedLog?.action.metadata && (
            <Input.TextArea
              readOnly
              size="small"
              label="Metadata"
              rows={5}
              className="input-mono input-xs"
              value={JSON.stringify(selectedLog.action.metadata, null, 2)}
            />
          )}
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}
