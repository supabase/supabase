import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useState } from 'react'

import { useParams } from 'common'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'
import { LINTER_LEVELS, LINT_TABS } from '../Linter/Linter.constants'

export const SecurityStatus = () => {
  const { ref } = useParams()
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useProjectLintsQuery({ projectRef: ref })

  const securityLints = (data ?? []).filter((lint) => lint.categories.includes('SECURITY'))
  const errorLints = securityLints.filter((lint) => lint.level === 'ERROR')
  const warnLints = securityLints.filter((lint) => lint.level === 'WARN')
  const infoLints = securityLints.filter((lint) => lint.level === 'INFO')

  const totalLints = errorLints.length + warnLints.length + infoLints.length
  const noIssuesFound = totalLints === 0

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
      <PopoverContent_Shadcn_ side="bottom" align="center" className={cn('py-1.5 px-0 w-64')}>
        <div className="text-sm">
          {noIssuesFound ? (
            <div className="flex gap-3 px-4">
              <CheckCircle2 className="text-brand shrink-0" size={18} strokeWidth={1.5} />
              <div className="grid gap-1">
                <p className="">No security issues found</p>
                <p className="text-xs text-foreground-light">
                  Keep monitoring Security Advisor for updates as your project grows.
                </p>
                <Button asChild type="default" className="w-min mt-2">
                  <Link href={`/project/${ref}/database/security-advisor`}>Security Advisor</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid">
              <p className="text-xs text-foreground-lighter px-3 pb-1.5">
                {totalLints} issue{totalLints > 1 ? 's' : ''} have been identified
              </p>
              <PopoverSeparator_Shadcn_ />
              {[
                { lints: errorLints, level: LINTER_LEVELS.ERROR },
                { lints: warnLints, level: LINTER_LEVELS.WARN },
                { lints: infoLints, level: LINTER_LEVELS.INFO },
              ].map(({ lints, level }) => {
                const { label, descriptionShort } = LINT_TABS.find((tab) => tab.id === level) ?? {}
                return (
                  lints.length > 0 && (
                    <Fragment key={level}>
                      <Link href={`/project/${ref}/database/security-advisor?preset=${level}`}>
                        <div className="group flex items-center justify-between w-full px-3 py-3 transition hover:bg-surface-300">
                          <div className="flex gap-x-3">
                            <div>
                              <StatusDot level={level} />
                            </div>
                            <div>
                              <p className="text-xs">
                                {lints.length}{' '}
                                {label === 'Info'
                                  ? 'suggestion'
                                  : label?.slice(0, label.length - 1).toLowerCase()}
                                {lints.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-foreground-light">{descriptionShort}</p>
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className="transition opacity-0 group-hover:opacity-100"
                          />
                        </div>
                      </Link>
                      <PopoverSeparator_Shadcn_ />
                    </Fragment>
                  )
                )
              })}
              <div className="flex items-center justify-end pt-2 pb-0.5 px-3">
                <Button asChild type="default" className="w-min">
                  <Link href={`/project/${ref}/database/security-advisor`}>Security Advisor</Link>
                </Button>
              </div>
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
