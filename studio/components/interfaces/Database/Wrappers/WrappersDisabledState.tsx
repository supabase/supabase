import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink } from 'ui'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { BASE_PATH } from 'lib/constants'
import { useTheme } from 'common'

const WrappersDisabledState = () => {
  const { ui, meta } = useStore()
  const { ref } = useParams()
  const { isDarkMode } = useTheme()
  const wrappersExtension = meta.extensions.byId('wrappers')
  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isNotAvailable = wrappersExtension === undefined || vaultExtension === undefined

  const [isEnabling, setIsEnabling] = useState<boolean>(false)
  const canToggleWrappers = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const onEnableWrappers = async () => {
    if (wrappersExtension === undefined || vaultExtension === undefined) return
    setIsEnabling(true)

    const requiredExtensions = await Promise.all([
      await meta.extensions.create({
        schema: wrappersExtension.schema ?? 'extensions',
        name: wrappersExtension.name,
        version: wrappersExtension.default_version,
        cascade: true,
      }),
      await meta.extensions.create({
        schema: vaultExtension.schema ?? 'vault',
        name: vaultExtension.name,
        version: vaultExtension.default_version,
        cascade: true,
      }),
    ])
    const errors = requiredExtensions.filter(
      (res) => res.error && !res.error.message.includes('already exists')
    )

    if (errors.length > 0) {
      ui.setNotification({
        error: errors,
        category: 'error',
        message: `Failed to enable Wrappers for your project: ${errors
          .map((x) => x.message)
          .join(', ')}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: 'Wrappers is now enabled for your project!',
      })
    }

    setIsEnabling(false)
  }

  return (
    <div>
      <div
        className="w-full px-12 py-12 bg-white bg-no-repeat border rounded dark:bg-scale-200 border-scale-500"
        style={{
          backgroundSize: '45%',
          backgroundPosition: '105% 40%',
          backgroundImage: isDarkMode
            ? `url("${BASE_PATH}/img/wrappers-dark.png")`
            : `url("${BASE_PATH}/img/wrappers-light.png")`,
        }}
      >
        <div className="w-3/5 space-y-8">
          <div className="space-y-2">
            <h4 className="text-lg">iEchor Wrappers</h4>
            <p className="text-sm text-scale-1100">
              iEchor Wrappers is a framework for building Postgres Foreign Data Wrappers (FDW)
              which connect Postgres to external systems. Query your data warehouse or third-party
              APIs directly from your database.
            </p>
          </div>
          {isNotAvailable ? (
            <div className="space-y-4">
              <div className="rounded border border-scale-500 px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-scale-1100 text-sm">
                    Wrappers is not available for this project yet.
                  </p>
                  <p className="text-scale-1000 text-sm">
                    Do reach out to us if you're interested!
                  </p>
                </div>
                <div>
                  <Link
                    href={`/support/new?ref=${ref}&category=sales&subject=Request%20for%20access%20to%20wrappers`}
                  >
                    <a target="_blank" rel="noreferrer">
                      <Button type="primary">Contact us</Button>
                    </a>
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-2 my-1 ml-[1px]">
                <Link href="https://iechor.com/docs/guides/database/extensions/wrappers">
                  <a target="_blank" rel="noreferrer">
                    <Button type="default" icon={<IconExternalLink />}>
                      About Wrappers
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="https://iechor.com/docs/guides/database/extensions/wrappers">
                <a target="_blank" rel="noreferrer">
                  <Button type="default" icon={<IconExternalLink />}>
                    About Wrappers
                  </Button>
                </a>
              </Link>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="primary"
                    loading={isEnabling}
                    disabled={isNotAvailable || isEnabling || !canToggleWrappers}
                    onClick={() => onEnableWrappers()}
                  >
                    Enable Wrappers
                  </Button>
                </Tooltip.Trigger>
                {!canToggleWrappers && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                          'border border-scale-200',
                        ].join(' ')}
                      >
                        <span className="text-xs text-scale-1200">
                          You need additional permissions to enable Wrappers for this project
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default observer(WrappersDisabledState)
