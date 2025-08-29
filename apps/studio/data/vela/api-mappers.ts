import { components } from './vela-schema'
import { Organization } from '../../types'
import { Project } from '../projects/project-detail-query'

export type VelaOrganization = components['schemas']['Organization']
export type VelaProject = components['schemas']['ProjectPublic']

export function mapOrganization(organization: VelaOrganization): Organization {
  return {
    id: organization.id!,
    name: organization.name!,
    slug: organization.name!,
    billing_email: '',
    plan: {
      id: 'enterprise',
      name: 'Enterprise',
    },
    is_owner: false,
    managed_by: 'vela',
    opt_in_tags: [],
    organization_requires_mfa: false,
    restriction_data: {},
    restriction_status: null,
    stripe_customer_id: null,
    subscription_id: null,
    usage_billing_enabled: false,
  }
}

export function mapProject(project: VelaProject): Project {
  return {
    id: project.id!,
    name: project.name!,
    ref: project.name!,
    organization_id: 1,
    cloud_provider: 'vela',
    status: 'ACTIVE_HEALTHY',
    region: 'local',
    inserted_at: new Date().toISOString(),
    db_host: 'localhost',
    is_branch_enabled: false,
    is_physical_backups_enabled: false,
    restUrl: '',
    subscription_id: '',
  }
}
