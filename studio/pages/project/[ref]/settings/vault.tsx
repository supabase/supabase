import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import {
  VaultToggle,
  SecretsManagement,
  EncryptionKeysManagement,
} from 'components/interfaces/Settings/Vault'
import { useStore } from 'hooks'
import { useEffect } from 'react'
import { Tabs } from 'ui'

const VaultSettings: NextPageWithLayout = () => {
  const { vault } = useStore()

  useEffect(() => {
    vault.load()
  }, [])

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <VaultToggle />

      {/* [Joshen] Consider splitting into separate pages */}
      <Tabs size="small" type="underlined">
        <Tabs.Panel id="secrets" label="Secrets Management">
          <SecretsManagement />
        </Tabs.Panel>
        <Tabs.Panel id="keys" label="Encryption Keys">
          <EncryptionKeysManagement />
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

VaultSettings.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default observer(VaultSettings)
