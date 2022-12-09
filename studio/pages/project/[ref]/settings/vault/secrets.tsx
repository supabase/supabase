import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'

import { useParams, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import { VaultToggle, SecretsManagement } from 'components/interfaces/Settings/Vault'
import { FormHeader } from 'components/ui/Forms'

const VaultSettingsSecrets: NextPageWithLayout = () => {
  const router = useRouter()
  const { meta, vault } = useStore()
  const { ref } = useParams()

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isEnabled = vaultExtension?.installed_version !== null

  useEffect(() => {
    vault.load()
  }, [])

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <FormHeader title="Vault" description="Application level encryption for your project" />
      {!isEnabled ? (
        <VaultToggle />
      ) : (
        <Tabs
          size="small"
          type="underlined"
          activeId="secrets"
          onChange={(id: any) => {
            if (id === 'keys') router.push(`/project/${ref}/settings/vault/keys`)
          }}
        >
          <Tabs.Panel id="secrets" label="Secrets Management">
            <SecretsManagement />
          </Tabs.Panel>
          <Tabs.Panel id="keys" label="Encryption Keys" />
        </Tabs>
      )}
    </div>
  )
}

VaultSettingsSecrets.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default observer(VaultSettingsSecrets)
