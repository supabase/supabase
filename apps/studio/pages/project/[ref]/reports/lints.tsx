import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { executeSql } from 'data/sql/execute-sql-query'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'
import { fakeLints, lint_sql } from './lints.utils'

import ReportLintsTableRow from 'components/interfaces/Reports/ReportLintsTableRow'
import Table from 'components/to-be-cleaned/Table'
import { useLocalStorageQuery } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { Accordion, LoadingLine } from 'ui'
import { Check, Loader } from 'lucide-react'

export type Lint = {
  name: string
  level: 'ERROR' | 'WARN' | 'INFO'
  facing: string
  description: string
  detail: string
  remediation: any
  metadata: {
    table: string
    fkey_name: string
    fkey_columns: number[]
  } | null
  cache_key: string
}

const ProjectLints: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [lintIgnoreList] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST, '')

  const [lints, setLints] = useState<Lint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const ignoredLints = fakeLints.filter((lint: Lint) =>
    lintIgnoreList.split(',').includes(lint.cache_key)
  )

  useEffect(() => {
    let cancel = false

    const loadLints = async () => {
      if (!cancel) setIsLoading(true)

      try {
        const res = await executeSql({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: lint_sql,
        })
        if (lints) setLints(res.result)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false) // Set loading to false after fetching data, regardless of success or failure
      }
    }
    loadLints()

    return () => {
      cancel = true
    }
  }, [])

  const headerText = (
    <p className="whitespace-pre-wrap prose text-sm max-w-2xl text-foreground-light">
      Identify common database schema issues
    </p>
  )

  const panelClassNames = 'text-sm max-w-none flex flex-col gap-8 py-4'

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-4 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <div className="content h-full w-full overflow-y-auto">
        <div className="w-full">
          <div className="p-4 py-3">
            <div className="flex flex-row justify-between gap-4 items-center">
              <h1 className="text-2xl text-foreground">Project lints</h1>
            </div>

            {headerText}

            <div className="flex flex-col">
              <div className={panelClassNames}>
                <div className="grid gap-4">
                  {/* isloading ( */}
                  {2 < 1 ? (
                    <div className="mt-4">
                      <GenericSkeletonLoader />
                    </div>
                  ) : (
                    <>
                      <LoadingLine loading={isLoading} />
                      <Table
                        head={[
                          <Table.th key="header-level">Level</Table.th>,
                          <Table.th key="header-type">Type</Table.th>,
                          <Table.th key="header-amount">Description</Table.th>,
                          <Table.th key="header-expand" className="text-right"></Table.th>,
                        ]}
                        body={
                          fakeLints.filter(
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
                              {fakeLints
                                .filter(
                                  (lint: Lint) =>
                                    !lintIgnoreList.split(',').includes(lint.cache_key)
                                )
                                .map((lint: Lint) => {
                                  return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                                })}
                            </>
                          )
                        }
                      />
                    </>
                  )}
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
                            fakeLints.length === 0 ? (
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
          </div>
        </div>
      </div>
    </div>
  )
}

ProjectLints.getLayout = (page) => <ReportsLayout title="Lints (rename)">{page}</ReportsLayout>

export default ProjectLints
