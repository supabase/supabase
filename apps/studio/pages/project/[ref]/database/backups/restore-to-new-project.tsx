import { useParams } from 'common'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { RestoreToNewProject } from 'components/interfaces/Database/RestoreToNewProject/RestoreToNewProject'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const RestoreToNewProjectPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { databaseRestoreToNewProject } = useIsFeatureEnabled(['database:restore_to_new_project'])

  if (!databaseRestoreToNewProject) {
    return <UnknownInterface urlBack={`/project/${ref}/database/backups/scheduled`} />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="rtnp" />
            <div className="space-y-8">
              <RestoreToNewProject />
            </div>
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

RestoreToNewProjectPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default RestoreToNewProjectPage
