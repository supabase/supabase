import { Admonition } from 'ui-patterns/Admonition'

export interface NoProjectsNoticeProps {
  appName: string
  organizationName: string
}

export const NoProjectsNotice = ({ appName, organizationName }: NoProjectsNoticeProps) => {
  return (
    <Admonition
      type="default"
      title={`No projects in ${organizationName}`}
      description={
        <>
          <p>
            {appName} needs access to at least one project, and this organization doesn't have any
            yet.
          </p>
        </>
      }
    />
  )
}
