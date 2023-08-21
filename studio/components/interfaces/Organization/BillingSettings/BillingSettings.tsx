import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'

import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useOrganizationCustomerProfileQuery } from 'data/organizations/organization-customer-profile-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions, useFlag, useSelectedOrganization } from 'hooks'
import OrganizationBillingMigrationPanel from '../GeneralSettings/OrganizationBillingMigrationPanel'
import BillingAddress from './BillingAddress/BillingAddress'
import BillingEmail from './BillingEmail'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods'
import ProjectsSummary from './ProjectsSummary'
import TaxID from './TaxID/TaxID'

const BillingSettings = () => {
  const { slug } = useParams()

  const organization = useSelectedOrganization()
  const { data: allProjects } = useProjectsQuery()
  const projects =
    allProjects?.filter((project) => project.organization_id === organization?.id) ?? []

  const { data: customer } = useOrganizationCustomerProfileQuery({ slug })

  const customerBalance = customer && customer.balance ? customer.balance / 100 : 0
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toString().replace('-', '')
      : customerBalance

  const orgBillingMigrationEnabled = useFlag('orgBillingMigration')
  const canMigrateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const selectedOrganization = useSelectedOrganization()
  const { subscription_id } = selectedOrganization ?? {}

  return (
    <ScaffoldContainerLegacy>
      {orgBillingMigrationEnabled && canMigrateOrganization && !subscription_id && (
        <OrganizationBillingMigrationPanel />
      )}

      <ProjectsSummary projects={projects} />

      <CreditBalance balance={balance} isCredit={isCredit} isDebt={isDebt} />

      <PaymentMethods />

      <BillingEmail />

      <BillingAddress />

      <TaxID />
    </ScaffoldContainerLegacy>
  )
}

export default BillingSettings
