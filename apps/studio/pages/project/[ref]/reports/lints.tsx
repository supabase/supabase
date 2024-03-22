import { Check, Loader } from 'lucide-react'

import ReportLintsTableRow from 'components/interfaces/Reports/ReportLintsTableRow'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useLocalStorageQuery } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Accordion, LoadingLine } from 'ui'

const ProjectLints: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [lintIgnoreList] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST, '')

  const { data: lints, isLoading } = useProjectLintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const ignoredLints = (lints ?? []).filter((lint: Lint) =>
    lintIgnoreList.split(',').includes(lint.cache_key)
  )

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12 space-y-1">
          <h3 className="text-xl text-foreground">Project Lints</h3>
          <div className="text-sm text-foreground-lighter">
            Identify common database schema issues
          </div>
        </div>

        <div className="col-span-12 flex flex-col">
          <div className="'text-sm max-w-none flex flex-col gap-8 py-4'">
            <div className="grid gap-4">
              <LoadingLine loading={isLoading} />
              <Table
                head={[
                  <Table.th key="header-level">Level</Table.th>,
                  <Table.th key="header-type">Type</Table.th>,
                  <Table.th key="header-amount">Description</Table.th>,
                  <Table.th key="header-expand" className="text-right"></Table.th>,
                ]}
                body={
                  (lints ?? []).filter(
                    (lint: Lint) => !lintIgnoreList.split(',').includes(lint.cache_key)
                  ).length === 0 ? (
                    <Table.tr>
                      <Table.td colSpan={6} className="p-3 py-12 text-center">
                        <p className="text-foreground-light">
                          {isLoading ? (
                            <div className="flex items-center gap-2 justify-center">
                              <Loader className="animate-spin" size={12} />
                              Checking project for issues...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-center">
                              <Check size={12} />
                              No issues have been found for this project
                            </div>
                          )}
                        </p>
                      </Table.td>
                    </Table.tr>
                  ) : (
                    <>
                      {(lints ?? [])
                        .filter((lint: Lint) => !lintIgnoreList.split(',').includes(lint.cache_key))
                        .map((lint: Lint) => {
                          return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                        })}
                    </>
                  )
                }
              />
            </div>

            {ignoredLints.length > 0 && (
              <div className="mt-4">
                <Accordion
                  openBehaviour="multiple"
                  chevronAlign="right"
                  className="border p-2 bg-surface-100 rounded"
                >
                  <Accordion.Item
                    header={
                      <div className="flex flex-row gap-2 items-center p-2">
                        Ignored issues ({ignoredLints.length})
                      </div>
                    }
                    id="1"
                    className="flex flex-row gap-8"
                  >
                    <Table
                      className="border-t mt-4"
                      body={
                        (lints ?? []).length === 0 ? (
                          <Table.tr>
                            <Table.td colSpan={6} className="p-3 py-12 text-center">
                              <p className="text-foreground-light">
                                {isLoading ? (
                                  <>
                                    <Loader className="animate-spin" size={12} />
                                    Checking for project issues
                                  </>
                                ) : (
                                  'No issues have been found for this project'
                                )}
                              </p>
                            </Table.td>
                          </Table.tr>
                        ) : (
                          <>
                            {ignoredLints.map((lint: Lint) => {
                              return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                            })}
                          </>
                        )
                      }
                    />
                  </Accordion.Item>
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

ProjectLints.getLayout = (page) => <ReportsLayout title="Lints (rename)">{page}</ReportsLayout>

export default ProjectLints
