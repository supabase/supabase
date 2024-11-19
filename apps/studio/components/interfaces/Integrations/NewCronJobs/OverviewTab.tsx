import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useState } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

export const CronjobsOverviewTab = () => {
  const { project } = useProjectContext()
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const pgCronExtensionInstalled = !!pgCronExtension?.installed_version

  return (
    <div>
      {pgCronExtensionInstalled ? (
        <div>This integration depends on "pg_cron" to function.</div>
      ) : (
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>Missing dependencies.</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="flex gap-2 flex-col">
            <div>The "pg_cron" extension is needed for this integration to work.</div>
            <Button onClick={() => setShowEnableExtensionModal(true)} className="w-fit">
              Enable pg_cron
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {pgCronExtension && (
        <EnableExtensionModal
          visible={showEnableExtensionModal}
          extension={pgCronExtension}
          onCancel={() => setShowEnableExtensionModal(false)}
        />
      )}
    </div>
  )
}
