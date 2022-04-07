import Link from 'next/link'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FC, useEffect } from 'react'
import { IconChevronRight, IconLoader } from '@supabase/ui'

import { useProjectSubscription, useStore } from 'hooks'
import Panel from 'components/to-be-cleaned/Panel'

dayjs.extend(utc)

interface ProjectSummaryProps {
  project: any
}

const ProjectSummary: FC<ProjectSummaryProps> = ({ project }) => {
  const { ui } = useStore()
  const { subscription, isLoading: loading, error } = useProjectSubscription(project.ref)

  const currentPeriodStart = subscription?.billing?.current_period_start ?? 0
  const currentPeriodEnd = subscription?.billing?.current_period_end ?? 0

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${error?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  return (
    <div className="w-full px-6 py-3 flex items-center">
      <div className="w-[25%]">
        <p className="text-sm">{project.name}</p>
      </div>
      {loading ? (
        <div className="w-[75%] flex items-center justify-center">
          <IconLoader size={14} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="w-[20%]">
            <p className="text-sm">{subscription?.tier.name ?? ''}</p>
          </div>
          <div className="w-[40%] space-x-2 flex items-center">
            <p className="text-sm">{dayjs.unix(currentPeriodStart).utc().format('MMM D, YYYY')}</p>
            <p className="text-sm">-</p>
            <p className="text-sm">{dayjs.unix(currentPeriodEnd).utc().format('MMM D, YYYY')}</p>
          </div>
          <div className="flex items-center justify-end w-[15%]">
            <Link href={`/project/${project.ref}/settings/billing`}>
              <a className="flex items-center space-x-2 group">
                <p className="transition group-hover:opacity-100 opacity-0 text-sm">View details</p>
                <IconChevronRight />
              </a>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

interface ProjectsSummaryProps {
  projects: any
}

const ProjectsSummary: FC<ProjectsSummaryProps> = ({ projects }) => {
  return (
    <div className="space-y-2">
      <h4>Projects at a glance</h4>
      <Panel
        title={
          <div className="w-full flex items-center">
            <div className="w-[25%]">
              <p className="text-sm opacity-50">Name</p>
            </div>
            <div className="w-[20%]">
              <p className="text-sm opacity-50">Plan</p>
            </div>
            <div className="w-[40%]">
              <p className="text-sm opacity-50">Billing cycle</p>
            </div>
            <div className="w-[15%]" />
          </div>
        }
      >
        {projects.map((project: any) => (
          <ProjectSummary key={project.ref} project={project} />
        ))}
        {projects.length === 0 && (
          <Panel.Content>
            <p className="text-sm text-scale-1100">No projects created yet</p>
          </Panel.Content>
        )}
      </Panel>
    </div>
  )
}

export default ProjectsSummary
