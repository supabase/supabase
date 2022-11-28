import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from 'ui'

import { useParams, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import { VaultToggle, EncryptionKeysManagement } from 'components/interfaces/Settings/Vault'

const VaultSettingsSecrets: NextPageWithLayout = () => {
  const router = useRouter()
  const { vault } = useStore()
  const { ref } = useParams()

  useEffect(() => {
    vault.load()
  }, [])

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <VaultToggle />

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
    </div>
  )
}

VaultSettingsSecrets.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default observer(VaultSettingsSecrets)
