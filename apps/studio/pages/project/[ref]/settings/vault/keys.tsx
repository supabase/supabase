import { useParams } from 'common'

import { EncryptionKeysManagement, VaultToggle } from 'components/interfaces/Settings/Vault'
import VaultNavTabs from 'components/interfaces/Settings/Vault/VaultNavTabs'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import type { NextPageWithLayout } from 'types'

const VaultSettingsSecrets: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const { data, isLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const vaultExtension = (data ?? []).find((ext) => ext.name === 'supabase_vault')
  const isEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Vault</ScaffoldTitle>
          <ScaffoldDescription>Application level encryption for your project</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer bottomPadding>
        {isLoading ? (
          <div className="border rounded border-default p-12 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : !isEnabled ? (
          <VaultToggle />
        ) : (
          <>
            <VaultNavTabs projRef={ref || ''} activeTab={'keys'} />
            <EncryptionKeysManagement />
          </>
        )}
      </ScaffoldContainer>
    </>
  )
}

VaultSettingsSecrets.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default VaultSettingsSecrets
