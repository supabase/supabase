import styles from '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import { initial, last } from 'lodash'
import { Dispatch, SetStateAction } from 'react'
import {
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'

import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { QueryResponseError } from 'data/sql/execute-sql-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks'
import Telemetry from 'lib/telemetry'
import { useTelemetryProps } from 'common'
import { useRouter } from 'next/router'

const QueryError = ({
  error,
  open,
  setOpen,
  onSelectDebug,
}: {
  error: QueryResponseError
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSelectDebug: () => void
}) => {
  const formattedError =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  // Customers on HIPAA plans should not have access to Supabase AI
  const organization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  return (
    <div className="flex flex-col gap-y-3 px-5">
      <Alert_Shadcn_ variant="destructive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clip-rule="evenodd"
          />
        </svg>
        <div className="flex flex-col gap-3">
          <AlertTitle_Shadcn_ className="m-0">Error running SQL query</AlertTitle_Shadcn_>

          <Collapsible_Shadcn_
            defaultOpen
            className="flex flex-col gap-3"
            open={open}
            onOpenChange={() => setOpen(!open)}
          >
            <div className="flex gap-2">
              <CollapsibleTrigger_Shadcn_ asChild>
                <Button
                  size={'tiny'}
                  type="outline"
                  className={cn('group', styles['ai-icon__container--allow-hover-effect'])}
                >
                  {open ? 'Hide error details' : 'Show error details'}
                </Button>
              </CollapsibleTrigger_Shadcn_>
              {!hasHipaaAddon && (
                <Button
                  size={'tiny'}
                  type="default"
                  className={cn(
                    'group',
                    styles['ai-icon__container--allow-hover-effect h-[21px] !py-0']
                  )}
                  onClick={() => {
                    onSelectDebug()
                    Telemetry.sendEvent(
                      {
                        category: 'rls_editor',
                        action: 'ai_debugger_requested',
                        label: 'rls-ai-assistant',
                      },
                      telemetryProps,
                      router
                    )
                  }}
                >
                  Fix with Assistant
                </Button>
              )}
            </div>
            <CollapsibleContent_Shadcn_ className="overflow-auto">
              {formattedError.length > 0 ? (
                formattedError.map((x: string, i: number) => (
                  <pre key={`error-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                    {x
                      .split(' ')
                      .reduce((arr, cur) => {
                        // Split the ERROR string so that it can be wrapped in a red span
                        const l = last(arr)

                        if (l && l !== 'ERROR:') {
                          return initial(arr).concat([[l, cur].join(' ')])
                        }

                        if (l === '') {
                          return arr.concat([' '])
                        }

                        return arr.concat([cur])
                      }, [] as string[])
                      .map((str, index, arr) => {
                        return (
                          <span
                            key={index}
                            className={cn('break-all', str === 'ERROR:' && 'text-destructive')}
                          >
                            {str}
                          </span>
                        )
                      })}
                  </pre>
                ))
              ) : (
                <p className="font-mono text-xs">{error.error}</p>
              )}
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>
        </div>
      </Alert_Shadcn_>
      <div className="overflow-x-auto"></div>
    </div>
  )
}

export default QueryError
