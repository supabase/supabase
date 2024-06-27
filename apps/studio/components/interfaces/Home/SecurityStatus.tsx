import { ExternalLink, Loader, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'

import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks'
import Link from 'next/link'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'

const SecurityStatus = () => {
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useProjectLintsQuery({
    projectRef: project?.ref,
  })

  const securityLints = (data ?? []).filter(
    (lint) =>
      lint.categories.includes('SECURITY') && (lint.level === 'ERROR' || lint.level === 'WARN')
  )

  const noIssuesFound = securityLints.length === 0

  return noIssuesFound ? null : (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          icon={
            isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-destructive-600" />
            )
          }
        >
          Security issues
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="py-1.5 px-0 w-72" side="bottom" align="start">
        <div className="px-4 py-2 text-sm flex gap-3">
          {noIssuesFound ? (
            <CheckCircle2 className="text-brand shrink-0" size={18} strokeWidth={1.5} />
          ) : (
            <WarningIcon className="shrink-0" />
          )}

          <div className="flex flex-col gap-y-3 -mt-1">
            <p>
              This project has {securityLints.length} security issues requiring urgent attention.
            </p>
            <Button asChild type="default" className="w-min" icon={<ExternalLink size={14} />}>
              <Link href={`/project/${project?.ref}/database/security-advisor`}>
                Security Advisor
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default SecurityStatus
