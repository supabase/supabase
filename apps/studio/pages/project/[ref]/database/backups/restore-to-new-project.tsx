import { useMemo } from 'react'

import { useParams } from 'common'
import { RestoreToNewProject } from 'components/interfaces/Database/RestoreToNewProject/RestoreToNewProject'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout, type NavigationItem } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const RestoreToNewProjectPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { databaseRestoreToNewProject } = useIsFeatureEnabled(['database:restore_to_new_project'])

  if (!databaseRestoreToNewProject) {
    return <UnknownInterface urlBack={`/project/${ref}/database/backups/scheduled`} />
  }

  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <div className="space-y-8">
          <RestoreToNewProject />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

RestoreToNewProjectPage.getLayout = (page) => {
  const BackupPageLayout = () => {
    const { ref, cloud_provider } = useSelectedProjectQuery()?.data || {}
    const { databaseRestoreToNewProject } = useIsFeatureEnabled(['database:restore_to_new_project'])

    const navigationItems: NavigationItem[] = useMemo(
      () => [
        {
          label: 'Scheduled backups',
          href: `/project/${ref}/database/backups/scheduled`,
        },
        {
          label: 'Point in time',
          href: `/project/${ref}/database/backups/pitr`,
        },
        ...(databaseRestoreToNewProject && cloud_provider !== 'FLY'
          ? [
              {
                label: 'Restore to new project',
                href: `/project/${ref}/database/backups/restore-to-new-project`,
                badge: 'Beta',
                active: true,
              },
            ]
          : []),
      ],
      [ref, databaseRestoreToNewProject, cloud_provider]
    )

    return (
      <PageLayout title="Database Backups" size="large" navigationItems={navigationItems}>
        {page}
      </PageLayout>
    )
  }

  return (
    <DefaultLayout>
      <DatabaseLayout title="Database">
        <BackupPageLayout />
      </DatabaseLayout>
    </DefaultLayout>
  )
}

export default RestoreToNewProjectPage
