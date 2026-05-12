import dayjs from 'dayjs'
import { Input_Shadcn_ as Input, SidePanel, TextArea_Shadcn_ as TextArea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import {
  TIMESTAMP_MICROS_PER_MS,
  type AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

interface LogDetailsPanelProps {
  selectedLog?: AuditLog
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
          <FormItemLayout label="Occurred at" description={timestampWithTz} isReactForm={false}>
            <Input
              readOnly
              size="small"
              value={
                selectedLog
                  ? dayjs(selectedLog.timestamp / TIMESTAMP_MICROS_PER_MS).toISOString()
                  : ''
              }
            />
          </FormItemLayout>
          <FormItemLayout label="Request ID" isReactForm={false}>
            <Input readOnly size="small" value={selectedLog?.request_id ?? ''} />
          </FormItemLayout>
          {selectedLog?.organization_slug && (
            <FormItemLayout label="Organization" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog.organization_slug} />
            </FormItemLayout>
          )}
          {selectedLog?.project_ref && (
            <FormItemLayout label="Project ref" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog.project_ref} />
            </FormItemLayout>
          )}
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Actor</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <FormItemLayout label="Token type" isReactForm={false}>
            <Input readOnly size="small" value={selectedLog?.actor.token_type ?? ''} />
          </FormItemLayout>
          {selectedLog?.actor.email && (
            <FormItemLayout label="Email" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog?.actor.email ?? ''} />
            </FormItemLayout>
          )}
          {selectedLog?.actor.user_id && (
            <FormItemLayout label="User ID" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog?.actor.user_id ?? ''} />
            </FormItemLayout>
          )}
          {selectedLog?.actor.ip && (
            <FormItemLayout label="IP address" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog?.actor.ip ?? ''} />
            </FormItemLayout>
          )}
          {selectedLog?.actor.oauth_app_name && (
            <FormItemLayout label="OAuth app" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog?.actor.oauth_app_name ?? ''} />
            </FormItemLayout>
          )}
          {selectedLog?.actor.app_name && (
            <FormItemLayout label="App" isReactForm={false}>
              <Input readOnly size="small" value={selectedLog?.actor.app_name ?? ''} />
            </FormItemLayout>
          )}
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Action</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <FormItemLayout label="Name" isReactForm={false}>
            <Input readOnly size="small" value={selectedLog?.action.name ?? ''} />
          </FormItemLayout>
          <FormItemLayout label="Method" isReactForm={false}>
            <Input readOnly size="small" value={selectedLog?.action.method ?? ''} />
          </FormItemLayout>
          <FormItemLayout label="Route" isReactForm={false}>
            <Input readOnly size="small" value={selectedLog?.action.route ?? ''} />
          </FormItemLayout>
          <FormItemLayout label="Status" isReactForm={false}>
            <Input readOnly size="small" value={String(selectedLog?.action.status ?? '')} />
          </FormItemLayout>
          {selectedLog?.action.metadata && (
            <FormItemLayout label="Metadata" isReactForm={false}>
              <TextArea
                readOnly
                rows={5}
                className="font-mono input-xs"
                value={JSON.stringify(selectedLog.action.metadata, null, 2)}
              />
            </FormItemLayout>
          )}
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}
