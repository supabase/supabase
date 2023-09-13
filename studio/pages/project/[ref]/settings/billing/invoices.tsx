import Link from 'next/link'

import { Invoices } from 'components/interfaces/BillingV2'
import { SettingsLayout } from 'components/layouts'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import InformationBox from 'components/ui/InformationBox'
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
  const orgSlug = selectedOrganization?.slug ?? ''

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
                  <Link href={`/org/${selectedOrganization?.slug}/billing`} passHref>
                    <a className="text-sm text-green-900 transition hover:text-green-1000">
                      organization billing settings
                    </a>
                  </Link>
                  .
                </p>

                <div className="space-x-3">
                  <Link href="https://supabase.com/blog/organization-based-billing" passHref>
                    <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                      <a target="_blank" rel="noreferrer">
                        Announcement
                      </a>
                    </Button>
                  </Link>
                  <Link href="https://supabase.com/docs/guides/platform/org-based-billing" passHref>
                    <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                      <a target="_blank" rel="noreferrer">
                        Documentation
                      </a>
                    </Button>
                  </Link>
                </div>
              </div>
            }
          />
        </div>

        <h4 className="text-lg">Invoices</h4>

        <div className="text-sm text-scale-1000">
          To manage your billing address, emails or Tax ID, head to your{' '}
          <Link href={`/org/${orgSlug}/billing`} passHref>
            <a className="text-sm text-green-900 transition hover:text-green-1000">
              organization settings
            </a>
          </Link>
          .
        </div>

        <Invoices />
      </div>
    </div>
  )
}
