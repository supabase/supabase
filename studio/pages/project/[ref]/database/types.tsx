import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { Button, IconExternalLink } from 'ui'

import { EnumeratedTypes } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="mb-1 text-xl text-foreground">Database Enumerated Types</h3>
                <div className="text-sm text-foreground-lighter">
                  Custom data types that you can use in your database tables or functions.
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link passHref href="https://www.postgresql.org/docs/current/datatype-enum.html">
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <a target="_blank" rel="noreferrer">
                      Documentation
                    </a>
                  </Button>
                </Link>
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
