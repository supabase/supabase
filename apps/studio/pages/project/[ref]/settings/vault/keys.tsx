import { useParams } from 'common'
import { useRouter } from 'next/router'
import { Tabs, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'

import { EncryptionKeysManagement, VaultToggle } from 'components/interfaces/Settings/Vault'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { NextPageWithLayout } from 'types'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import Link from 'next/link'

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
        <Tabs_Shadcn_ defaultValue="keys">
          <TabsList_Shadcn_>
            <TabsTrigger_Shadcn_ asChild value="secrets">
              <Link href={`/project/${ref}/settings/vault/secrets`}>Secrets Management</Link>
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ asChild value="keys">
              <Link href={`/project/${ref}/settings/vault/keys`}>Encryption Keys</Link>
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
          <TabsContent_Shadcn_ value="keys">
            <EncryptionKeysManagement />
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      )}
    </div>
  )
}

VaultSettingsSecrets.getLayout = (page) => <SettingsLayout title="Vault">{page}</SettingsLayout>
export default VaultSettingsSecrets
