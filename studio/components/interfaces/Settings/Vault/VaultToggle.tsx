import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { FC, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconExternalLink } from 'ui'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { checkPermissions, useParams, useStore } from 'hooks'

interface Props {}

const VaultToggle: FC<Props> = () => {
  const { meta, ui } = useStore()
  const { ref } = useParams()
  const [isEnabling, setIsEnabling] = useState(false)
  const canToggleVault = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

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
        className="px-12 py-12 w-full bg-white dark:bg-scale-200 border border-scale-500 rounded bg-no-repeat"
        style={{
          backgroundSize: isNotAvailable ? '50%' : '40%',
          backgroundPosition: '100% 24%',
          backgroundImage: ui.isDarkTheme
            ? 'url("/img/vault-dark.png")'
            : 'url("/img/vault-light.png")',
        }}
      >
        <div className="w-3/5 space-y-8">
          <div className="space-y-2">
            <h4 className="text-lg">Enable Vault today</h4>
            <p className="text-sm text-scale-1100">
              Supabase Vault is a Postgres extension for managing secrets and encryption inside your
              database without leaking any sensitive information.
            </p>
          </div>
          {isNotAvailable ? (
            <div className="space-y-4">
              <div className="rounded border border-scale-500 px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-scale-1100 text-sm">
                    Vault is not available for this project yet.
                  </p>
                  <p className="text-scale-1000 text-sm">
                    Do reach out to us if you're interested!
                  </p>
                </div>
                <div>
                  <Link
                    href={`/support/new?ref=${ref}&category=sales&subject=Request%20for%20access%20to%20vault`}
                  >
                    <a target="_blank">
                      <Button type="primary">Contact us</Button>
                    </a>
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-2 my-1 ml-[1px]">
                <Link href="https://supabase.com/docs/guides/database/vault">
                  <a target="_blank">
                    <Button type="default" icon={<IconExternalLink />}>
                      About Vault
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="https://supabase.com/docs/guides/database/vault">
                <a target="_blank">
                  <Button type="default" icon={<IconExternalLink />}>
                    About Vault
                  </Button>
                </a>
              </Link>
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
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
                        You need additional permissions to enable Vault for this project
                      </span>
                    </div>
                  </Tooltip.Content>
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
