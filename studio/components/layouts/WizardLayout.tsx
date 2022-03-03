import { FC } from 'react'
import Link from 'next/link'
import { IconChevronRight } from '@supabase/ui'

const WizardLayout: FC<any> = ({ organization, project, children }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <Header organization={organization} project={project} />
      <div className="overflow-auto">
        <section className="mx-auto max-w-2xl relative my-10 has-slide-in slide-in">
          {children}
        </section>
      </div>
    </div>
  )
}
export default WizardLayout

const Header: FC<any> = ({ organization, project }) => {
  let stepNumber = organization ? 1 : project ? 2 : 0
  return (
    <div className="p-3 border-b dark:border-dark">
      <div className="PageHeader">
        <div className="Breadcrumbs flex justify-between">
          <div className="text-sm flex items-center">
            <div className="space-x-2 flex items-center">
              <Link href="/">
                <a>
                  <img
                    src="/img/supabase-logo.svg"
                    alt="Supabase"
                    className="border dark:border-dark rounded p-1 hover:border-white"
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
