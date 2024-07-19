import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { Button, IconExternalLink } from 'ui'

const VaultToggle = () => {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { project } = useProjectContext()
  const [isEnabling, setIsEnabling] = useState(false)
  const canToggleVault = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const vaultExtension = (data ?? []).find((ext) => ext.name === 'supabase_vault')
  const isNotAvailable = vaultExtension === undefined

  const { mutate: enableExtension } = useDatabaseExtensionEnableMutation({
    onSuccess: () => {
      toast.success(`Vault is now enabled for your project!`)
    },
    onError: (error) => {
      toast.error(`Failed to enable Vault for your project: ${error.message}`)
      setIsEnabling(false)
    },
  })

  const onEnableVault = async () => {
    if (vaultExtension === undefined) return
    if (project === undefined) return console.error('Project is required')

    setIsEnabling(true)

    try {
      await executeSql({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: `create schema if not exists ${vaultExtension.schema ?? 'vault'};`,
      })
    } catch (createSchemaError: any) {
      setIsEnabling(false)
      return toast.error(`Failed to create schema: ${createSchemaError.message}`)
    }

    enableExtension({
      projectRef: project.ref,
      connectionString: project.connectionString,
      schema: vaultExtension.schema ?? 'vault',
      name: vaultExtension.name,
      version: vaultExtension.default_version,
      cascade: true,
    })
  }

  return (
    <div>
      <div
        className="px-12 py-12 w-full bg-studio border rounded bg-no-repeat"
        style={{
          backgroundSize: isNotAvailable ? '50%' : '40%',
          backgroundPosition: '100% 24%',
          backgroundImage: resolvedTheme?.includes('dark')
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
                <Tooltip.Trigger asChild>
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

export default VaultToggle
