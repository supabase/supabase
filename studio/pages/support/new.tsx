import * as Tooltip from '@radix-ui/react-tooltip'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import SVG from 'react-inlinesvg'
import { Button, IconLoader, IconTool } from 'ui'

import Success from 'components/interfaces/Support/Success'
import SupportForm from 'components/interfaces/Support/SupportForm'
import { usePlatformStatusQuery } from 'data/platform/platform-status-query'
import { useFlag, withAuth } from 'hooks'
import { BASE_PATH } from 'lib/constants'

const SupportPage = () => {
  const [sentCategory, setSentCategory] = useState<string>()

  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  const { data, isLoading } = usePlatformStatusQuery()
  const isHealthy = data?.isHealthy

  return (
    <div
      className="relative flex overflow-y-auto overflow-x-hidden"
      style={{ height: maxHeight, maxHeight }}
    >
      <div className="mx-auto my-8 max-w-2xl px-4 lg:px-6">
        <div className="space-y-12 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <SVG src={`${BASE_PATH}/img/supabase-logo.svg`} className="h-4 w-4" />
              <h1 className="m-0 text-lg">Supabase support</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link passHref href="https://supabase.com/docs/guides/platform/troubleshooting">
                <a target="_blank" rel="noreferrer">
                  <Button type="default" icon={<IconTool />}>
                    Troubleshooting
                  </Button>
                </a>
              </Link>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Link href="https://status.supabase.com/">
                    <a target="_blank" rel="noreferrer">
                      <Button
                        type="default"
                        icon={
                          isLoading ? (
                            <IconLoader className="animate-spin" />
                          ) : isHealthy ? (
                            <div className="h-2 w-2 bg-brand rounded-full" />
                          ) : (
                            <div className="h-2 w-2 bg-yellow-900 rounded-full" />
                          )
                        }
                      >
                        {isLoading
                          ? 'Checking status'
                          : isHealthy
                          ? 'All systems operational'
                          : 'Active incident ongoing'}
                      </Button>
                    </a>
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">Check Supabase status page</span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </div>
          <div
            className={[
              'min-w-full space-y-12 rounded border bg-panel-body-light shadow-md',
              `${sentCategory === undefined ? 'py-8' : 'pt-8'}`,
              'dark:border-dark dark:bg-panel-body-dark',
            ].join(' ')}
          >
            {sentCategory !== undefined ? (
              <Success sentCategory={sentCategory} />
            ) : (
              <SupportForm setSentCategory={setSentCategory} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(observer(SupportPage), { useHighestAAL: false })
