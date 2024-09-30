import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  PopoverSeparator_Shadcn_,
  cn,
} from 'ui'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'

import { LINTER_LEVELS, LINT_TABS } from '../Linter/Linter.constants'

export const SecurityStatus = () => {
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useProjectLintsQuery({ projectRef: project?.ref })

  const securityLints = (data ?? []).filter((lint) => lint.categories.includes('SECURITY'))
  const errorLints = securityLints.filter((lint) => lint.level === 'ERROR')
  const warnLints = securityLints.filter((lint) => lint.level === 'WARN')
  const infoLints = securityLints.filter((lint) => lint.level === 'INFO')

  const noIssuesFound = errorLints.length === 0 && warnLints.length === 0 && infoLints.length === 0

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          icon={
            isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  noIssuesFound
                    ? 'bg-brand'
                    : errorLints.length > 0
                      ? 'bg-destructive-600'
                      : 'bg-warning-600'
                )}
              />
            )
          }
        >
          Security Issues
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className={`py-1.5 px-0 ${noIssuesFound ? 'w-72' : 'w-84'}`}
        side="bottom"
        align="center"
      >
        <div className="py-2 text-sm flex gap-3">
          {noIssuesFound ? (
            <div className="flex gap-3 px-4">
              <CheckCircle2 className="text-brand shrink-0" size={18} strokeWidth={1.5} />
              <div className="grid gap-1">
                <p className="">No security issues found</p>
                <p className="text-xs text-foreground-light">
                  Keep monitoring Security Advisor for updates as your project grows.
                </p>
                <Button asChild type="default" className="w-min mt-2">
                  <Link href={`/project/${project?.ref}/database/security-advisor`}>
                    Security Advisor
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-y-4">
              {[
                { lints: errorLints, level: LINTER_LEVELS.ERROR },
                { lints: warnLints, level: LINTER_LEVELS.WARN },
                { lints: infoLints, level: LINTER_LEVELS.INFO },
              ].map(
                ({ lints, level }) =>
                  lints.length > 0 && (
                    <>
                      <div key={level} className="flex gap-3 pb-0 px-4">
                        <StatusDot level={level} />
                        <div>
                          {lints.length} {level.toLowerCase()} issue{lints.length > 1 ? 's' : ''}
                          <p className="text-xs text-foreground-lighter">
                            {LINT_TABS.find((tab) => tab.id === level)?.descriptionShort}
                          </p>
                        </div>
                      </div>
                      <PopoverSeparator_Shadcn_ />
                    </>
                  )
              )}
              <Button asChild type="default" className="w-min ml-4">
                <Link
                  href={`/project/${project?.ref}/database/security-advisor${errorLints.length === 0 ? '?preset=WARN' : ''}`}
                >
                  Security Advisor
                </Link>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

const StatusDot = ({ level }: { level: LINTER_LEVELS }) => {
  const variants = {
    [LINTER_LEVELS.ERROR]: 'bg-destructive-600',
    [LINTER_LEVELS.WARN]: 'bg-warning-600',
    [LINTER_LEVELS.INFO]: 'bg-foreground-lighter dark:bg-foreground-light',
  }
  return <div className={cn('w-2 h-2 rounded-full mt-1.5', variants[level])} />
}
