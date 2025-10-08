import dayjs from 'dayjs'

import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import type { AuditLog } from 'data/organizations/organization-audit-logs-query'
import { Input, SidePanel } from 'ui'

export interface LogDetailsPanelProps {
  selectedLog?: AuditLog
  onClose: () => void
}

const LogDetailsPanel = ({ selectedLog, onClose }: LogDetailsPanelProps) => {
  return (
    <SidePanel
      size="large"
      header={`"${selectedLog?.action.name}" on ${dayjs(selectedLog?.occurred_at).format(
        'DD MMM YYYY, HH:mm:ss'
      )}`}
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
            value={selectedLog?.occurred_at}
            descriptionText={dayjs(selectedLog?.occurred_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')}
          />
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Actor</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input readOnly size="small" label="Actor ID" value={selectedLog?.actor.id} />
          <Input.TextArea
            readOnly
            size="small"
            label="Metadata"
            rows={5}
            className="input-mono input-xs"
            value={JSON.stringify(selectedLog?.actor.metadata, null, 2)}
          />
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Action</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input readOnly size="small" label="Name" value={selectedLog?.action.name} />
          <Input.TextArea
            readOnly
            size="small"
            label="Metadata"
            rows={5}
            className="input-mono input-xs"
            value={JSON.stringify(selectedLog?.action.metadata, null, 2)}
          />
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Target</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input readOnly size="small" label="Name" value={selectedLog?.target.description} />
          <Input.TextArea
            readOnly
            size="small"
            label="Metadata"
            rows={5}
            className="input-mono input-xs"
            value={JSON.stringify(selectedLog?.target.metadata, null, 2)}
          />
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}

export default LogDetailsPanel
