import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import type { NextPageWithLayout } from 'types'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Destinations from 'components/interfaces/Database/Replication/Destinations'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus } from 'lucide-react'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader
              title="Database Replication"
              description="Send data to other destinations"
            />
          </div>
        </ScaffoldSection>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="flex">
              <FormHeader
                title="Destinations"
                description="Publish data from your primary database to another"
              />
              <ButtonTooltip
                type="default"
                icon={<Plus />}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'Add a new destination',
                  },
                }}
                className="mt-6 mb-8"
              >
                Add destination
              </ButtonTooltip>
            </div>
            <Destinations />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default DatabaseReplicationPage
