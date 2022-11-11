import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { SettingsLayout } from 'components/layouts'
import { VaultToggle, SecretsManagement } from 'components/interfaces/Settings/Vault'

const VaultSettings: NextPageWithLayout = () => {
  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32 ">
      <VaultToggle />

      {/* Show secrets table if vault extension is enabled */}
      <SecretsManagement />
    </div>
  )
}

VaultSettings.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default observer(VaultSettings)
