import { observer } from 'mobx-react-lite'

import { useParams } from 'common'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { EnumeratedTypes } from 'components/interfaces/Database'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="mb-6">
              <h3 className="mb-1 text-xl text-foreground">Database Enumerated Types</h3>
              <div className="text-sm text-foreground-lighter">
                Custom data types that you can use in your database tables or functions.
              </div>
            </div>
            <EnumeratedTypes />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

DatabaseEnumeratedTypes.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default observer(DatabaseEnumeratedTypes)
