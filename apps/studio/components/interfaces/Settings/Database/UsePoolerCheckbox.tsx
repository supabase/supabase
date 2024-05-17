import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCheck,
  IconChevronDown,
  Separator,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usePgBouncerStatus } from 'data/config/pgbouncer-enabled-query'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import Link from 'next/link'

interface UsePoolerCheckboxInterface {
  id: string
  checked: boolean
  poolingMode: 'transaction' | 'session' | 'statement'
  onCheckedChange: (value: boolean) => void
  onSelectPoolingMode: (mode: 'transaction' | 'session') => void
}

export const UsePoolerCheckbox = ({
  id,
  checked,
  poolingMode = 'transaction',
  onCheckedChange,
  onSelectPoolingMode,
}: UsePoolerCheckboxInterface) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const snap = useDatabaseSettingsStateSnapshot()
  const state = useDatabaseSelectorStateSnapshot()

  const { data, isLoading, isSuccess } = usePoolingConfigurationQuery({ projectRef })
  const { data: settings, isSuccess: isSuccessSettings } = useProjectSettingsQuery({ projectRef })
  const { data: pgBouncerStatus } = usePgBouncerStatus({ projectRef: projectRef })

  const isDatabaseSettingsPage = router.pathname.endsWith('/settings/database')
  const readReplicasEnabled = project?.is_read_replicas_enabled
  const poolingConfiguration = readReplicasEnabled
    ? data?.find((x) => x.identifier === state.selectedDatabaseId)
    : data?.find((x) => x.database_type === 'PRIMARY')
  const resolvesToIpV6 = settings?.project.db_ip_addr_config === 'ipv6'

  const onSelectOption = (value: 'session' | 'transaction') => {
    onSelectPoolingMode(value)
    setOpen(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-1">
        <div className="flex gap-x-3 items-center">
          <Checkbox_Shadcn_
            id={`use-pooler-${id}`}
            checked={checked}
            onCheckedChange={() => onCheckedChange(!checked)}
          />
          <div className="-mt-[2px] flex flex-col gap-y-1 w-full">
            <div className="flex items-center gap-x-4">
              <div className="flex items-center gap-x-2">
                <label htmlFor={`use-pooler-${id}`} className="text-sm cursor-pointer">
                  Display connection pooler
                </label>
                {checked && (
                  <>
                    <div className="flex items-center gap-x-2">
                      {isLoading && <ShimmeringLoader className="w-[100px] py-2.5" />}
                      {isSuccess && (
                        <div className="flex items-center gap-x-1">
                          <DropdownMenu open={open} onOpenChange={setOpen}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="outline"
                                className="py-0.5 pr-1.5"
                                iconRight={<IconChevronDown strokeWidth={1} />}
                              >
                                <span className="capitalize">Mode: {poolingMode}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="start" className="w-[280px]">
                              <DropdownMenuItem
                                key="session"
                                className="flex items-center justify-between"
                                onClick={() => onSelectOption('session')}
                              >
                                <span>Session mode</span>
                                {poolingMode === 'session' && <IconCheck className="text-brand" />}
                              </DropdownMenuItem>
                              {poolingConfiguration?.pool_mode === 'transaction' && (
                                <DropdownMenuItem
                                  key="transaction"
                                  className="flex items-center justify-between"
                                  onClick={() => onSelectOption('transaction')}
                                >
                                  <span>Transaction mode</span>
                                  {poolingMode === 'transaction' && (
                                    <IconCheck className="text-brand" />
                                  )}
                                </DropdownMenuItem>
                              )}

                              {poolingConfiguration?.pool_mode === 'session' && (
                                <>
                                  <Separator className="my-1" />
                                  <div className="px-2 text-xs flex flex-col gap-y-2">
                                    <p>
                                      To use transaction mode, change the pool mode in the{' '}
                                      {isDatabaseSettingsPage ? (
                                        <span
                                          tabIndex={0}
                                          className="underline hover:text-foreground cursor-pointer transition"
                                          onClick={() => {
                                            const el = document.getElementById('connection-pooler')
                                            if (el) {
                                              setOpen(false)
                                              el.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'center',
                                              })
                                            }
                                          }}
                                        >
                                          pooling configuration settings
                                        </span>
                                      ) : (
                                        <Link
                                          href={`/project/${projectRef}/settings/database#connection-pooler`}
                                          className="underline hover:text-foreground"
                                        >
                                          pooling configuration settings
                                        </Link>
                                      )}{' '}
                                      to use transaction mode first.
                                    </p>
                                    <p>
                                      You can then connect to session mode on port 5432 and
                                      transaction mode on port 6543.
                                    </p>
                                  </div>
                                </>
                              )}

                              <Separator className="my-1" />
                              <DropdownMenuItem
                                key="more-info"
                                onClick={() => {
                                  setOpen(false)
                                  snap.setShowPoolingModeHelper(true)
                                }}
                              >
                                How to choose pooling modes?
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-x-1">
                {isSuccess && checked && <Badge>Supavisor</Badge>}
                {isSuccessSettings && (
                  <Badge>
                    {checked
                      ? 'Resolves to IPv4'
                      : resolvesToIpV6
                        ? 'Resolves to IPv6'
                        : 'Will resolve to IPv6'}
                  </Badge>
                )}
                {pgBouncerStatus?.active && (
                  <Badge variant="warning">PgBouncer pending removal</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
