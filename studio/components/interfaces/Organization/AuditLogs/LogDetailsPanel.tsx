import { useParams } from 'common'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import { OrganizationAuditLog } from 'data/organizations/organization-audit-logs-query'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import dayjs from 'dayjs'
import { Button, Input, SidePanel } from 'ui'

export interface LogDetailsPanelProps {
  selectedLog?: OrganizationAuditLog
  onClose: () => void
}

const LogDetailsPanel = ({ selectedLog, onClose }: LogDetailsPanelProps) => {
  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()

  const project = projects?.find(
    (project) => project.ref === selectedLog?.permission_group.project_ref
  )
  const organization = organizations?.find(
    (org) => org.slug === selectedLog?.permission_group.org_slug
  )

  return (
    <SidePanel
      size="large"
      header={`"${selectedLog?.action.name}" on ${dayjs(selectedLog?.timestamp).format(
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
            label="Description"
            value={selectedLog?.target.description}
          />
          <Input
            readOnly
            size="small"
            label="Timestamp"
            value={selectedLog?.timestamp}
            descriptionText={dayjs(selectedLog?.timestamp).format('DD MMM YYYY, HH:mm:ss (ZZ)')}
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
            value={JSON.stringify(selectedLog?.actor.metadata)}
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
            value={JSON.stringify(selectedLog?.action.metadata)}
          />
        </FormSectionContent>
      </FormSection>

      <SidePanel.Separator />

      <FormSection header={<FormSectionLabel>Permission Group</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input
            readOnly
            size="small"
            label="Organization slug"
            disabled={(selectedLog?.permission_group.org_slug ?? '').length === 0}
            value={selectedLog?.permission_group.org_slug ?? 'None'}
            descriptionText={organization?.name && `Organization: ${organization.name}`}
          />
          <Input
            readOnly
            size="small"
            label="Project reference"
            disabled={(selectedLog?.permission_group.project_ref ?? '').length === 0}
            value={selectedLog?.permission_group.project_ref ?? 'None'}
            descriptionText={project?.name && `Project: ${project.name}`}
          />
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}

export default LogDetailsPanel
