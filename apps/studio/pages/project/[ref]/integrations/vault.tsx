import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { VaultOverviewTab } from 'components/interfaces/Integrations/Vault/OverviewTab'
import { EncryptionKeysManagement, SecretsManagement } from 'components/interfaces/Settings/Vault'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { parseAsString, useQueryState } from 'nuqs'
import type { NextPageWithLayout } from 'types'

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: <VaultOverviewTab />,
  },
  {
    id: 'keys',
    label: 'Encryption Keys',
    content: (
      <div className="p-10">
        <EncryptionKeysManagement />
      </div>
    ),
  },
  {
    id: 'secrets',
    label: 'Secrets Management',
    content: (
      <div className="p-10">
        <SecretsManagement />
      </div>
    ),
  },
]

const VaultPage: NextPageWithLayout = () => {
  const id = 'vault'
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  if (!integration) {
    return null
  }

  return (
    <IntegrationsLayout id={id} tabs={tabs}>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </IntegrationsLayout>
  )
}

export default VaultPage
