import { partition, sortBy } from 'lodash'
import { Check, ExternalLink, Loader } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AccordionTrigger } from '@ui/components/shadcn/ui/accordion'
import { FilterPopover } from 'components/interfaces/AuditLogs'
import ReportLintsTableRow from 'components/interfaces/Reports/ReportLintsTableRow'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useLocalStorageQuery, useSelectedProject } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  Accordion_Shadcn_,
  Button,
  LoadingLine,
} from 'ui'

const ProjectLints: NextPageWithLayout = () => {
  const project = useSelectedProject()
  const [filters, setFilters] = useState({
    levels: [] as string[],
    types: [] as string[],
  })
  const [lintIgnoreList] = useLocalStorageQuery<string[]>(
    LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST,
    []
  )

  const { data, isLoading, isRefetching, refetch } = useProjectLintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // sort the lints by level, ERROR should be at the top.
  const lints = sortBy(data || [], (lint) => {
    if (lint.level === 'ERROR') return 0
    if (lint.level === 'WARN') return 1
    if (lint.level === 'INFO') return 2
    return 3
  })

  const [ignoredLints, activeLints] = partition(lints, (lint) =>
    lintIgnoreList.includes(lint.cache_key)
  )
  const filteredLints = useMemo(() => {
    return activeLints
      .filter((x) => (filters.levels.length > 0 ? filters.levels.includes(x.level) : x))
      .filter((x) => (filters.types.length > 0 ? filters.types.includes(x.name) : x))
  }, [activeLints, filters.levels, filters.types])

  const warnLintsCount = activeLints.filter((x) => x.level === 'WARN').length
  const errorLintsCount = activeLints.filter((x) => x.level === 'ERROR').length

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12 flex items-center justify-between">
          <div className="flec flex-col gap-y-1">
            <h3 className="text-xl text-foreground">Database Linter</h3>
            <div className="text-sm text-foreground-lighter">
              Identify common schema problems in your database
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
                  { name: 'Auth RLS Initialization Plan', value: 'auth_rls_initplan' },
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
              <a href="https://supabase.github.io/splinter" target="_blank" rel="noreferrer">
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
              ...(activeLints.length === 0
                ? [
                    <Table.tr key="empty-state">
                      <Table.td colSpan={6} className="p-3 py-12">
                        {isLoading ? (
                          <div className="flex items-center gap-x-2">
                            <Loader className="animate-spin" size={12} />
                            <p className="text-foreground-light">Checking database for issues...</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-x-2">
                            <Check size={12} />
                            <p className="text-foreground-light">
                              No issues have been found for this database
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
                            No problems found based on the selected filters
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

        {ignoredLints.length > 0 && (
          <div className="col-span-12 flex flex-col text-sm max-w-none gap-8 py-4">
            <Accordion_Shadcn_ type="single" collapsible>
              <AccordionItem_Shadcn_ value="1" className="border-none">
                <AccordionTrigger className="px-4 bg-surface-100 rounded border [&[data-state=open]]:rounded-b-none hover:no-underline">
                  <div className="text-sm text-foreground-light font-normal">
                    Ignored problems ({ignoredLints.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent_Shadcn_>
                  <Table
                    body={
                      (lints ?? []).length === 0 ? (
                        <Table.tr>
                          <Table.td colSpan={6} className="p-3 py-12 text-center">
                            <p className="text-foreground-light">
                              {isLoading ? (
                                <>
                                  <Loader className="animate-spin" size={12} />
                                  Checking for database issues
                                </>
                              ) : (
                                'No issues have been found for this database'
                              )}
                            </p>
                          </Table.td>
                        </Table.tr>
                      ) : (
                        <>
                          {ignoredLints.map((lint) => {
                            return <ReportLintsTableRow key={lint.cache_key} lint={lint} />
                          })}
                        </>
                      )
                    }
                  />
                </AccordionContent_Shadcn_>
              </AccordionItem_Shadcn_>
            </Accordion_Shadcn_>
          </div>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

ProjectLints.getLayout = (page) => <DatabaseLayout title="Linter">{page}</DatabaseLayout>

export default ProjectLints
