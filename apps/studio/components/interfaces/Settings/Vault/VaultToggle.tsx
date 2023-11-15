import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink } from 'ui'

import { useCheckPermissions, useStore } from 'hooks'
import { BASE_PATH } from 'lib/constants'

const VaultToggle = () => {
  const { meta, ui } = useStore()
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const [isEnabling, setIsEnabling] = useState(false)
  const canToggleVault = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isNotAvailable = vaultExtension === undefined

  const onEnableVault = async () => {
    if (vaultExtension === undefined) return
    setIsEnabling(true)

    const { error: createSchemaError } = await meta.query(
      `create schema if not exists ${vaultExtension.schema ?? 'vault'};`
    )
    if (createSchemaError) {
      setIsEnabling(false)
      return ui.setNotification({
        error: createSchemaError,
        category: 'error',
        message: `Failed to create schema: ${createSchemaError.message}`,
      })
    }

    const { error: createExtensionError } = await meta.extensions.create({
      schema: vaultExtension.schema ?? 'vault',
      name: vaultExtension.name,
      version: vaultExtension.default_version,
      cascade: true,
    })
    if (createExtensionError) {
      ui.setNotification({
        error: createExtensionError,
        category: 'error',
        message: `Failed to enable Vault for your project: ${createExtensionError.message}`,
      })
      setIsEnabling(false)
    } else {
      ui.setNotification({
        category: 'success',
        message: 'Vault is now enabled for your project!',
      })
    }
  }

  return (
    <div>
      <div
        className="px-12 py-12 w-full bg-background border rounded bg-no-repeat"
        style={{
          backgroundSize: isNotAvailable ? '50%' : '40%',
          backgroundPosition: '100% 24%',
          backgroundImage:
            resolvedTheme === 'dark'
              ? `url("${BASE_PATH}/img/vault-dark.png")`
              : `url("${BASE_PATH}/img/vault-light.png")`,
        }}
      >
        <div className="w-3/5 space-y-8">
          <div className="space-y-2">
            <h4 className="text-lg">Enable Vault today</h4>
            <p className="text-sm text-foreground-light">
              Supabase Vault is a Postgres extension for managing secrets and encryption inside your
              database without leaking any sensitive information.
            </p>
          </div>
          {isNotAvailable ? (
            <div className="space-y-4">
              <div className="rounded border px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-foreground-light text-sm">
                    Vault is not available for this project yet.
                  </p>
                  <p className="text-foreground-light text-sm">
                    Do reach out to us if you're interested!
                  </p>
                </div>
                <div>
                  <Button asChild type="primary">
                    <Link
                      href={`/support/new?ref=${ref}&category=sales&subject=Request%20for%20access%20to%20vault`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Contact us
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 my-1 ml-[1px]">
                <Button asChild type="default" icon={<IconExternalLink />}>
                  <Link href="https://github.com/supabase/vault" target="_blank" rel="noreferrer">
                    About Vault
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild type="default" icon={<IconExternalLink />}>
                <Link href="https://github.com/supabase/vault" target="_blank" rel="noreferrer">
                  About Vault
                </Link>
              </Button>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="primary"
                    loading={isEnabling}
                    disabled={isNotAvailable || isEnabling || !canToggleVault}
                    onClick={() => onEnableVault()}
                  >
                    Enable Vault
                  </Button>
                </Tooltip.Trigger>
                {!canToggleVault && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          You need additional permissions to enable Vault for this project
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

export default observer(VaultToggle)
