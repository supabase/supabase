import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import type { Organization, Project } from 'types'
import { IconChevronRight } from 'ui'
import { FeedbackDropdown } from './ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from './ProjectLayout/LayoutHeader/HelpPopover'

interface WizardLayoutProps {
  organization: Organization | null | undefined
  project: Project | null
}

const WizardLayout = ({
  organization,
  project,
  children,
}: PropsWithChildren<WizardLayoutProps>) => {
  return (
    <div className="flex w-full flex-col">
      <Header organization={organization} project={project} />
      <div className="overflow-auto">
        <section className="has-slide-in slide-in relative mx-auto my-10 max-w-2xl">
          {children}
        </section>
      </div>
    </div>
  )
}

export default withAuth(WizardLayout)

export const WizardLayoutWithoutAuth = WizardLayout

const Header = ({ organization, project }: WizardLayoutProps) => {
  let stepNumber = organization ? 1 : project ? 2 : 0
  return (
    <div className="border-b p-3 border-default">
      <div className="PageHeader">
        <div className="Breadcrumbs flex justify-between">
          <div className="flex items-center text-sm">
            <div className="flex items-center space-x-2">
              <Link href="/projects">
                <img
                  src={`${BASE_PATH}/img/supabase-logo.svg`}
                  alt="Supabase"
                  className="rounded border p-1 hover:border-white border-default"
                  style={{ height: 24 }}
                />
              </Link>
              <IconChevronRight size="small" className="text-foreground-light" />
              <p className="text-sm">
                {organization ? `Organization: ${organization.name}` : 'Create an organization'}
              </p>
              <IconChevronRight size="small" className="text-foreground-light" />
              <p className={`text-sm ${stepNumber < 1 ? 'text-foreground-light' : ''}`}>
                {project ? project.name : 'Create a new project'}
              </p>
              <IconChevronRight size="small" className="text-foreground-light" />
              <p className={`text-sm ${stepNumber < 2 ? 'text-foreground-light' : ''}`}>
                {project ? project.name : 'Extend your database'}
              </p>
            </div>
          </div>
          <div className="flex">{/* The End */}</div>
          <div className="flex items-center space-x-2">
            <HelpPopover />
            <FeedbackDropdown />
          </div>
        </div>
      </div>
    </div>
  )
}
