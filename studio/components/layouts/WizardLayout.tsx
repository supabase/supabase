import { FC } from 'react'
import Link from 'next/link'
import { IconChevronRight } from '@supabase/ui'
import { withAuth } from 'hooks'
import { observer } from 'mobx-react-lite'

const WizardLayout: FC<any> = ({ organization, project, children }) => {
  return (
    <div className="flex h-full w-full flex-col">
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

const Header: FC<any> = ({ organization, project }) => {
  let stepNumber = organization ? 1 : project ? 2 : 0
  return (
    <div className="dark:border-dark border-b p-3">
      <div className="PageHeader">
        <div className="Breadcrumbs flex justify-between">
          <div className="flex items-center text-sm">
            <div className="flex items-center space-x-2">
              <Link href="/">
                <a>
                  <img
                    src="/img/supabase-logo.svg"
                    alt="Supabase"
                    className="dark:border-dark rounded border p-1 hover:border-white"
                    style={{ height: 24 }}
                  />
                </a>
              </Link>
              <IconChevronRight size="small" className="text-scale-1100" />
              <p className="text-sm">
                {organization ? `Organization: ${organization.name}` : 'Create an organization'}
              </p>
              <IconChevronRight size="small" className="text-scale-1100" />
              <p className={`text-sm ${stepNumber < 1 ? 'text-scale-1100' : ''}`}>
                {project ? project.name : 'Create a new project'}
              </p>
              <IconChevronRight size="small" className="text-scale-1100" />
              <p className={`text-sm ${stepNumber < 2 ? 'text-scale-1100' : ''}`}>
                {project ? project.name : 'Extend your database'}
              </p>
            </div>
          </div>
          <div className="flex">{/* End */}</div>
        </div>
      </div>
    </div>
  )
}
