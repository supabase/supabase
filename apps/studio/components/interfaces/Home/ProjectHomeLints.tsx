import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks'
import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import { ExternalLink } from 'lucide-react'

const ProjectHomeLints = () => {
  const project = useSelectedProject()

  const { data } = useProjectLintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const securityLints = (data ?? []).filter(
    (lint) =>
      lint.categories.includes('SECURITY') && (lint.level === 'ERROR' || lint.level === 'WARN')
  )

  return (
    <>
      {securityLints.length > 0 && (
        <div className="mx-6 my-8">
          <Alert_Shadcn_
            className="flex w-full items-center justify-between my-3"
            variant="warning"
          >
            <WarningIcon />
            <div>
              <AlertTitle_Shadcn_>Security Advisor</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                <p>
                  This project has {securityLints.length} security issues requiring urgent
                  attention.
                </p>
                <Button asChild type="default" className="w-min" icon={<ExternalLink size={14} />}>
                  <Link href={`/project/${project?.ref}/database/security-advisor`}>
                    Security Advisor
                  </Link>
                </Button>
              </AlertDescription_Shadcn_>
            </div>
          </Alert_Shadcn_>
        </div>
      )}
    </>
  )
}

export default ProjectHomeLints
