import Link from 'next/link'
import { FC, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconExternalLink } from 'ui'

import { FormHeader } from 'components/ui/Forms'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { checkPermissions, useStore } from 'hooks'
import { PostgresExtension } from '@supabase/postgres-meta'

interface Props {}

const VaultToggle: FC<Props> = () => {
  const { meta, ui } = useStore()
  const [isEnabling, setIsEnabling] = useState(false)
  const canToggleVault = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const [vaultExtension] = meta.extensions.list(
    (ext: PostgresExtension) => ext.name.toLowerCase() === 'supabase_vault'
  )

  // [Joshen TODO] Need to put this logic correctly once i can toggle vault extension
  const isEnabled = vaultExtension?.installed_version !== null

  const onEnableVault = async () => {
    if (vaultExtension === undefined) return
    setIsEnabling(true)

    const { error: createSchemaError } = await meta.query(
      `create schema if not exists ${vaultExtension.schema}`
    )
    if (createSchemaError) {
      return ui.setNotification({
        error: createSchemaError,
        category: 'error',
        message: `Failed to create schema: ${createSchemaError.message}`,
      })
    }

    const { error: createExtensionError } = await meta.extensions.create({
      schema: vaultExtension.schema,
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
    } else {
      ui.setNotification({
        category: 'success',
        message: 'Vault is now enabled for your project!',
      })
    }
  }

  return (
    <div>
      <FormHeader title="Vault" description="Application level encryption for your project" />
      <div
        className="px-12 py-12 w-full border border-scale-500 rounded bg-no-repeat"
        style={{
          backgroundSize: '45%',
          backgroundPosition: '112% 50%',
          backgroundImage: 'url("/img/supabase-vault.webp")',
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
          <div className="flex items-center space-x-2">
            <Link href="https://supabase.com/docs">
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
                  disabled={isEnabling || !canToggleVault}
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
        </div>
      </div>
    </div>
  )
}

export default VaultToggle
