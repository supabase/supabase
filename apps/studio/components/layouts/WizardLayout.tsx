import Link from 'next/link'
import { PropsWithChildren } from 'react'

import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import { ChevronRight } from 'lucide-react'
import type { Organization, Project } from 'types'
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
              <ChevronRight size="18" className="text-foreground-light" strokeWidth={1} />
              <p className="text-sm hidden md:block">
                {organization ? `Organization: ${organization.name}` : 'Create an organization'}
              </p>
              <ChevronRight
                size="18"
                className="text-foreground-light hidden md:block"
                strokeWidth={1}
              />
              <p className={`text-sm ${stepNumber < 1 ? 'text-foreground-light' : ''}`}>
                {project ? project.name : 'Create a new project'}
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
