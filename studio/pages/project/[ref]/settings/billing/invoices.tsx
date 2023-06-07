import { observer } from 'mobx-react-lite'
import { FC, useEffect } from 'react'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import { useStore } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { NextPageWithLayout, Project } from 'types'

import { Invoices } from 'components/interfaces/Billing'
import Link from 'next/link'

const ProjectBilling: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div className="w-full h-full overflow-y-auto content">
      <div className="w-full mx-auto">
        <Settings project={project} />
      </div>
    </div>
  )
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBilling)

interface SettingsProps {
  project?: Project
}

const Settings: FC<SettingsProps> = ({ project }) => {
  const { ui } = useStore()
  const orgSlug = ui.selectedOrganization?.slug ?? ''

  const { data: subscription, error } = useProjectSubscriptionQuery({
    projectRef: ui.selectedProject?.ref,
  })

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${(error as any)?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      {/* [Joshen TODO] Temporarily hidden until usage endpoint is sorted out */}
      {/* {projectTier !== undefined && <OveragesBanner tier={projectTier} />} */}

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

        <Invoices projectRef={ui.selectedProject?.ref ?? ''} />
      </div>
    </div>
  )
}
