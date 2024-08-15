import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'

import { Wrappers } from 'components/interfaces/Database'
import WrappersDropdown from 'components/interfaces/Database/Wrappers/WrappersDropdown'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

const DatabaseWrappers: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const { isLoading: isLoadingFDWs } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: exts, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const wrappersExtension = (exts ?? []).find((ext) => ext.name === 'wrappers')
  const vaultExtension = (exts ?? []).find((ext) => ext.name === 'supabase_vault')

  const isWrappersEnabled =
    wrappersExtension !== undefined &&
    wrappersExtension.installed_version !== null &&
    vaultExtension !== undefined &&
    vaultExtension.installed_version !== null

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionContent className="xl:!col-span-8">
          <FormHeader
            className="!mb-0"
            title="Foreign Data Wrappers"
            description="Query your data warehouse directly from your database, or third-party APIs using SQL"
          />
        </ScaffoldSectionContent>
        <ScaffoldSectionDetail className="xl:!col-span-4 flex items-center justify-end gap-x-2">
          <Button asChild type="default" icon={<ExternalLink size={14} strokeWidth={1.5} />}>
            <a
              target="_blank"
              rel="noreferrer"
              className="no-underline"
              href="https://supabase.com/docs/guides/database/extensions/wrappers/overview"
            >
              Documentation
            </a>
          </Button>
          {isWrappersEnabled && <WrappersDropdown />}
        </ScaffoldSectionDetail>

        <div className="col-span-12 mt-3">
          {isLoadingExtensions || isLoadingFDWs ? (
            <GenericSkeletonLoader />
          ) : isPermissionsLoaded && !canReadWrappers ? (
            <NoPermission isFullPage resourceText="view foreign data wrappers" />
          ) : (
            <Wrappers isEnabled={isWrappersEnabled} />
          )}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseWrappers.getLayout = (page) => <DatabaseLayout title="Wrappers">{page}</DatabaseLayout>

export default DatabaseWrappers
