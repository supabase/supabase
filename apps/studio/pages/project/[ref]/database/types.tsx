import Link from 'next/link'
import { Button, IconExternalLink } from 'ui'

import { EnumeratedTypes } from 'components/interfaces/Database'
import { DatabaseLayout } from 'components/layouts'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { NextPageWithLayout } from 'types'

const DatabaseEnumeratedTypes: NextPageWithLayout = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionContent className="gap-0" title="Database Enumerated Types">
            <h3 className="mb-1 text-xl text-foreground">Database Enumerated Types</h3>
            <p className="text-sm text-foreground-lighter">
              Custom data types that you can use in your database tables or functions.
            </p>
          </ScaffoldSectionContent>
          <ScaffoldSectionDetail className="flex items-center justify-end">
            <div>
              <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                <Link
                  href="https://www.postgresql.org/docs/current/datatype-enum.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </Link>
              </Button>
            </div>
          </ScaffoldSectionDetail>
          <div className="col-span-12 mt-3">
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

export default DatabaseEnumeratedTypes
