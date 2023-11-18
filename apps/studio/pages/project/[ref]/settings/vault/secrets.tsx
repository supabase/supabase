import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'

import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import { VaultToggle, SecretsManagement } from 'components/interfaces/Settings/Vault'
import { FormHeader } from 'components/ui/Forms'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

const VaultSettingsSecrets: NextPageWithLayout = () => {
  const router = useRouter()
  const { meta, vault } = useStore()
  const { ref } = useParams()

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isLoading = meta.extensions.isLoading
  const isEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (isEnabled) {
      vault.load()
    }
  }, [isEnabled])

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <FormHeader title="Vault" description="Application level encryption for your project" />
      {isLoading ? (
        <div className="border rounded border-default p-12 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : !isEnabled ? (
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
