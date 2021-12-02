import { FC } from 'react'
import Link from 'next/link'
import BaseLayout from 'components/layouts'
import { IconChevronRight, Typography } from '@supabase/ui'

const WizardLayout: FC<any> = ({ organization, project, children }) => {
  return (
    <BaseLayout hideHeader hideIconBar>
      <div className="flex flex-col h-full w-full">
        <Header organization={organization} project={project} />
        <div className="overflow-auto">
          <section className="mx-auto max-w-2xl relative my-10 has-slide-in slide-in">
            {children}
          </section>
        </div>
      </div>
    </BaseLayout>
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
              <Typography.Text type="secondary">
                <IconChevronRight size="small" />
              </Typography.Text>
              <Typography.Text small>
                <a>
                  {organization
                    ? `Organization: ${organization.name}`
                    : '1. Create an organization'}
                </a>
              </Typography.Text>
              <Typography.Text type="secondary">
                <IconChevronRight size="small" />
              </Typography.Text>
              <Typography.Text small type={stepNumber < 1 ? 'secondary' : 'default'}>
                <a>{project ? project.name : 'Create a new project'}</a>
              </Typography.Text>
              <Typography.Text type="secondary">
                <IconChevronRight size="small" />
              </Typography.Text>
              <Typography.Text small type={stepNumber < 2 ? 'secondary' : 'default'}>
                <a>{project ? project.name : 'Extend your database'}</a>
              </Typography.Text>
            </div>
          </div>
          <div className="flex">{/* End */}</div>
        </div>
      </div>
    </div>
  )
}
