import { partition } from 'lodash'
import { Check, ExternalLink, Loader } from 'lucide-react'
import { useState } from 'react'

import { FilterPopover } from 'components/interfaces/AuditLogs'
import ReportLintsTableRow from 'components/interfaces/Reports/ReportLintsTableRow'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useLocalStorageQuery } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Accordion, Button, LoadingLine } from 'ui'

const ProjectLints: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [filters, setFilters] = useState({
    levels: [] as string[],
    types: [] as string[],
  })
  const [lintIgnoreList] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST, '')

  const {
    data: lints,
    isLoading,
    isRefetching,
    refetch,
  } = useProjectLintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [ignoredLints, activeLints] = partition(lints ?? [], (lint) =>
    lintIgnoreList.split(',').includes(lint.cache_key)
  )
  const filteredLints =
    filters.levels.length > 0 || filters.types.length > 0
      ? (lints ?? [])
          .filter((x) => (filters.levels.length > 0 ? filters.levels.includes(x.level) : x))
          .filter((x) => (filters.types.length > 0 ? filters.types.includes(x.name) : x))
      : lints ?? []
  const warnLintsCount = activeLints.filter((x) => x.level === 'WARN').length
  const errorLintsCount = activeLints.filter((x) => x.level === 'ERROR').length

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12 flex items-center justify-between">
          <div className="flec flex-col gap-y-1">
            <h3 className="text-xl text-foreground">Project Linter</h3>
            <div className="text-sm text-foreground-lighter">
              Identify common schema problems in your project's database
            </div>
          </div>
        </div>

        <div className="col-span-12 flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-2">
              <p className="text-xs prose">Filter by</p>
              <FilterPopover
                name="Level"
                options={[
                  { name: 'Info', value: 'INFO' },
                  { name: 'Warning', value: 'WARN' },
                  { name: 'Error', value: 'ERROR' },
                ]}
                labelKey="name"
                valueKey="value"
                activeOptions={filters.levels}
                onSaveFilters={(values) => setFilters({ ...filters, levels: values })}
              />
              <FilterPopover
                name="Type"
                options={[
                  { name: 'Unindexed foreign keys', value: 'unindexed_foreign_keys' },
                  { name: 'Auth users exposed', value: 'auth_users_exposed' },
                  { name: 'No primary key', value: 'no_primary_key' },
                  { name: 'Unused index', value: 'unused_index' },
                  { name: 'Multiple permissive policies', value: 'multiple_permissive_policies' },
                ]}
                labelKey="name"
                valueKey="value"
                activeOptions={filters.types}
                onSaveFilters={(values) => setFilters({ ...filters, types: values })}
              />
            </div>
            <p className="text-foreground-light text-xs">
              Identified {activeLints.length} problems{' '}
              {warnLintsCount > 0 || errorLintsCount > 0
                ? `(${errorLintsCount > 0 ? `${errorLintsCount} errors` : ''}${errorLintsCount > 0 && warnLintsCount > 0 ? ', ' : ''}${warnLintsCount > 0 ? `${warnLintsCount} warnings` : ''})`
                : null}
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <Button asChild type="default" icon={<ExternalLink />}>
              <a href="/" target="_blank" rel="noreferrer">
                Documentation
              </a>
            </Button>
            <Button
              type="primary"
              disabled={isLoading || isRefetching}
              loading={isLoading || isRefetching}
              onClick={() => refetch()}
            >
              Rerun linter
            </Button>
          </div>
        </div>

        <div className="col-span-12">
          <Table
            head={[
              <Table.th key="level" className="py-2">
                Level
              </Table.th>,
              <Table.th key="header-type" className="py-2">
                Problem
              </Table.th>,
              <Table.th key="header-expand" className="py-2 text-right"></Table.th>,
            ]}
            body={[
              <Table.tr key="loader">
                <Table.td colSpan={12} className="!p-0">
                  <LoadingLine loading={isLoading || isRefetching} />
                </Table.td>
              </Table.tr>,
              ...((lints ?? []).filter(
                (lint: Lint) => !lintIgnoreList.split(',').includes(lint.cache_key)
              ).length === 0
                ? [
                    <Table.tr key="empty-state">
                      <Table.td colSpan={6} className="p-3 py-12">
                        {isLoading ? (
                          <div className="flex items-center gap-x-2">
                            <Loader className="animate-spin" size={12} />
                            <p className="text-foreground-light">Checking project for issues...</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-x-2">
                            <Check size={12} />
                            <p className="text-foreground-light">
                              No issues have been found for this project
                            </p>
                          </div>
                        )}
                      </Table.td>
                    </Table.tr>,
                  ]
                : (filters.levels.length > 0 || filters.types.length > 0) &&
                    filteredLints.length === 0
                  ? [
                      <Table.tr key="empty-state">
                        <Table.td colSpan={6} className="p-3 py-12">
                          <p className="text-foreground-light">
                            No problems found based on the selected filteres
                          </p>
                        </Table.td>
                      </Table.tr>,
                    ]
                  : filteredLints.map((lint) => {
                      return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                    })),
            ]}
          />
        </div>

        <div className="col-span-12 flex flex-col">
          <div className="'text-sm max-w-none flex flex-col gap-8 py-4'">
            {ignoredLints.length > 0 && (
              <div className="mt-4">
                <Accordion
                  openBehaviour="multiple"
                  chevronAlign="right"
                  className="border p-2 bg-surface-100 rounded"
                >
                  <Accordion.Item
                    header={
                      <div className=" text-sm text-foreground-light flex flex-row gap-2 items-center p-2">
                        Ignored problems ({ignoredLints.length})
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

ProjectLints.getLayout = (page) => <ReportsLayout title="Linter">{page}</ReportsLayout>

export default ProjectLints
