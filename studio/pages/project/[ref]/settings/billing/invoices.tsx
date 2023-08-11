import Link from 'next/link'

import { Invoices } from 'components/interfaces/BillingV2'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const ProjectBilling: NextPageWithLayout = () => {
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id
  const router = useRouter()

  useEffect(() => {
    if (isOrgBilling) {
      router.push(`/org/${organization.slug}/invoices`)
    }
  }, [router, organization?.slug, isOrgBilling])

  if (isOrgBilling) return null

  return (
    <div className="w-full h-full overflow-y-auto content">
      <div className="w-full mx-auto">
        <Settings />
      </div>
    </div>
  )
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default ProjectBilling

const Settings = () => {
  const selectedOrganization = useSelectedOrganization()
  const { project: selectedProject } = useProjectContext()
  const orgSlug = selectedOrganization?.slug ?? ''

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      <div className="space-y-2">
        <h4 className="text-lg">Invoices</h4>

        <div className="text-sm text-scale-1000">
          To manage your billing address, emails or Tax ID, head to your{' '}
          <Link href={`/org/${orgSlug}/billing`}>
            <a>
              <span className="text-sm text-green-900 transition hover:text-green-1000">
                organization settings
              </span>
              .
            </a>
          </Link>
        </div>

        <Invoices projectRef={selectedProject?.ref ?? ''} />
      </div>
    </div>
  )
}
