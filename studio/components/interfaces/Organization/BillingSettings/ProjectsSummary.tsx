import Link from 'next/link'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FC } from 'react'
import { Typography, IconChevronRight } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

dayjs.extend(utc)

interface Props {
  projects: any
}

const ProjectsSummary: FC<Props> = ({ projects }) => {
  return (
    <div className="space-y-2">
      <Typography.Title level={4}>Projects at a glance</Typography.Title>
      <Panel
        title={
          <div className="w-full flex items-center">
            <div className="w-[25%]">
              <Typography.Text type="secondary">Name</Typography.Text>
            </div>
            <div className="w-[20%]">
              <Typography.Text type="secondary">Plan</Typography.Text>
            </div>
            <div className="w-[40%]">
              <Typography.Text type="secondary">Billing cycle</Typography.Text>
            </div>
            <div className="w-[15%]" />
          </div>
        }
      >
        {projects.map((project: any) => {
          const currentPeriodStart = project.subscription.current_period_start
          const currentPeriodEnd = project.subscription.current_period_end
          return (
            <div key={project.ref} className="w-full px-6 py-3 flex items-center">
              <div className="w-[25%]">
                <Typography.Text>{project.name}</Typography.Text>
              </div>
              <div className="w-[20%]">
                <Typography.Text>{project.subscription_tier}</Typography.Text>
              </div>
              <div className="w-[40%] space-x-2">
                <Typography.Text>
                  {dayjs.unix(currentPeriodStart).utc().format('MMM D, YYYY')}
                </Typography.Text>
                <Typography.Text>-</Typography.Text>
                <Typography.Text>
                  {dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')}
                </Typography.Text>
              </div>
              <div className="flex items-center justify-end w-[15%]">
                <Link href={`/project/${project.ref}/settings/billing`}>
                  <a className="flex items-center space-x-2 group">
                    <Typography.Text small className="transition group-hover:opacity-100 opacity-0">
                      View details
                    </Typography.Text>
                    <IconChevronRight />
                  </a>
                </Link>
              </div>
            </div>
          )
        })}
      </Panel>
    </div>
  )
}

export default ProjectsSummary
