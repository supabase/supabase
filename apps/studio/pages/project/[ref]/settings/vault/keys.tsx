import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Tabs } from 'ui'

import { EncryptionKeysManagement, VaultToggle } from 'components/interfaces/Settings/Vault'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const VaultSettingsSecrets: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { vault } = useStore()
  const { project } = useProjectContext()

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const vaultExtension = (data ?? []).find((ext) => ext.name === 'supabase_vault')
  const isEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (isEnabled) {
      vault.load()
    }
  }, [isEnabled])

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <FormHeader title="Vault" description="Application level encryption for your project" />
      {!isEnabled ? (
        <VaultToggle />
      ) : (
        <Tabs
          size="small"
          type="underlined"
          activeId="keys"
          onChange={(id: any) => {
            if (id === 'secrets') router.push(`/project/${ref}/settings/vault/secrets`)
          }}
        >
          <Tabs.Panel id="secrets" label="Secrets Management" />
          <Tabs.Panel id="keys" label="Encryption Keys">
            <EncryptionKeysManagement />
          </Tabs.Panel>
        </Tabs>
      )}
    </div>
  )
}

VaultSettingsSecrets.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default observer(VaultSettingsSecrets)
