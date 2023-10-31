import Link from 'next/link'

import { Invoices } from 'components/interfaces/BillingV2'
import { SettingsLayout } from 'components/layouts'
import InformationBox from 'components/ui/InformationBox'
import { useSelectedOrganization } from 'hooks'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'types'
import { Button, IconExternalLink, IconInfo } from 'ui'

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
  const orgSlug = selectedOrganization?.slug ?? '_'

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      <div className="space-y-2">
        <div className="py-2">
          <InformationBox
            icon={<IconInfo size="large" strokeWidth={1.5} />}
            defaultVisibility={true}
            hideCollapse
            title="We're upgrading our billing system"
            description={
              <div className="space-y-3">
                <p className="text-sm leading-normal">
                  This organization uses the legacy project-based billing. We’ve recently made some
                  big improvements to our billing system. To migrate to the new organization-based
                  billing, head over to your{' '}
                  <Link
                    href={`/org/${selectedOrganization?.slug}/billing`}
                    className="text-sm text-green-900 transition hover:text-green-1000"
                  >
                    organization billing settings
                  </Link>
                  .
                </p>

                <div className="space-x-3">
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <Link
                      href="https://supabase.com/blog/organization-based-billing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Announcement
                    </Link>
                  </Button>
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <Link
                      href="https://supabase.com/docs/guides/platform/org-based-billing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Documentation
                    </Link>
                  </Button>
                </div>
              </div>
            }
          />
        </div>

        <h4 className="text-lg">Invoices</h4>

        <div className="text-sm text-foreground-light">
          To manage your billing address, emails or Tax ID, head to your{' '}
          <Link
            href={`/org/${orgSlug}/billing`}
            className="text-sm text-green-900 transition hover:text-green-1000"
          >
            organization settings
          </Link>
          .
        </div>

        <Invoices />
      </div>
    </div>
  )
}
