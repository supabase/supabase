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
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const [lintIgnoreList] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST, '')

  const [lints, setLints] = useState<Lint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancel = false

    const loadLints = async () => {
      setIsLoading(true) // Set loading to true before fetching data
      if (!cancel) {
        // setFetchingSchemaInfo(true)
        // setDefaultSchema(undefined)
      }
      try {
        const res = await executeSql({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: lint_sql,
        })
        if (lints) setLints(res.result)
        //if (!cancel) setDefaultSchema(res.result[0].schema)
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

  const handleRefresh = async () => {
    console.log('refresh')
  }

  const headerText = (
    <p className="whitespace-pre-wrap prose text-sm max-w-2xl text-foreground-light">
      Identify common database schema issues
    </p>
  )

  const panelClassNames = 'text-sm max-w-none flex flex-col gap-8 py-4'

  return (
    <div className="p-4 py-3">
      <ReportHeader title="Project lints" isLoading={false} onRefresh={handleRefresh} />

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
              <Table
                head={[
                  <Table.th key="header-level">Level</Table.th>,
                  <Table.th key="header-type">Type</Table.th>,
                  <Table.th key="header-amount">Description</Table.th>,
                  <Table.th key="header-expand" className="text-right"></Table.th>,
                ]}
                body={
                  fakeLints.length === 0 ? (
                    <Table.tr>
                      <Table.td colSpan={6} className="p-3 py-12 text-center">
                        <p className="text-foreground-light">
                          {isLoading
                            ? 'Checking for project lints'
                            : 'No lints have been found for this project'}
                        </p>
                      </Table.td>
                    </Table.tr>
                  ) : (
                    <>
                      {fakeLints
                        .filter((lint: Lint) => !lintIgnoreList.split(',').includes(lint.cache_key))
                        .map((lint: Lint) => {
                          return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                        })}
                    </>
                  )
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

ProjectLints.getLayout = (page) => <ReportsLayout title="Lints (rename)">{page}</ReportsLayout>

export default ProjectLints
