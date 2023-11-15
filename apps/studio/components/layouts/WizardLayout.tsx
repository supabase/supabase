import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { IconChevronRight } from 'ui'

import { useFlag, withAuth } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { Organization, Project } from 'types'
import FeedbackDropdown from './ProjectLayout/LayoutHeader/FeedbackDropdown'
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
  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div className="flex w-full flex-col" style={{ height: maxHeight, maxHeight }}>
      <Header organization={organization} project={project} />
      <div className="overflow-auto">
        <section className="has-slide-in slide-in relative mx-auto my-10 max-w-2xl">
          {children}
        </section>
      </div>
    </div>
  )
}

export default withAuth(observer(WizardLayout))

export const WizardLayoutWithoutAuth = observer(WizardLayout)

const Header = ({ organization, project }: WizardLayoutProps) => {
  let stepNumber = organization ? 1 : project ? 2 : 0
  return (
    <div className="border-b p-3 dark:border-dark">
      <div className="PageHeader">
        <div className="Breadcrumbs flex justify-between">
          <div className="flex items-center text-sm">
            <div className="flex items-center space-x-2">
              <Link href="/projects">
                <img
                  src={`${BASE_PATH}/img/supabase-logo.svg`}
                  alt="Supabase"
                  className="rounded border p-1 hover:border-white dark:border-dark"
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
