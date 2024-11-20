import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { IntegrationWrapper } from 'components/interfaces/Integrations/Landing/IntegrationWrapper'
import { VaultOverviewTab } from 'components/interfaces/Integrations/Vault/OverviewTab'
import { EncryptionKeysManagement, SecretsManagement } from 'components/interfaces/Settings/Vault'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className="p-9">
        <VaultOverviewTab />
      </div>
    ),
  },
  {
    id: 'keys',
    label: 'Encryption Keys',
    content: (
      <div className="p-9">
        <EncryptionKeysManagement />
      </div>
    ),
  },
  {
    id: 'secrets',
    label: 'Secrets Management',
    content: (
      <div className="p-9">
        <SecretsManagement />
      </div>
    ),
  },
]

const VaultPage: NextPageWithLayout = () => {
  const id = 'supabase-vault'

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration) {
    return null
  }

  return <IntegrationWrapper integration={integration} tabs={tabs} />
}

VaultPage.getLayout = (page) => {
  return (
    <ProjectLayout title="Integrations" product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default VaultPage
