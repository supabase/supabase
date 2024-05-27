import { useRouter } from 'next/router'
import { useParams } from 'common/hooks'
import { SecretsManagement, VaultToggle } from 'components/interfaces/Settings/Vault'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import type { NextPageWithLayout } from 'types'
import VaultNavTabs from 'components/interfaces/Settings/Vault/VaultNavTabs'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'

const VaultSettingsSecrets: NextPageWithLayout = () => {
  const router = useRouter()
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
            <VaultNavTabs projRef={ref || ''} activeTab="secrets" />
            <SecretsManagement />
          </>
        )}
      </ScaffoldContainer>
    </>
  )
}

VaultSettingsSecrets.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default VaultSettingsSecrets
