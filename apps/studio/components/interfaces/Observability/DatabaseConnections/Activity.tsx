import { isEqual } from 'lodash'
import { Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ReportsSelectFilter } from '../../Reports/v2/ReportsSelectFilter'
import { ActivityRow } from './ActivityRow'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery } from '@/data/database/activity-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const DEFAULT_ROLES_FILTER = ['anon', 'authenticated', 'postgres']

interface ActivityProps {
  live?: boolean
}

export const Activity = ({ live }: ActivityProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [selectedPid] = useQueryState('pid', parseAsInteger)

  const [
    {
      search: searchFilter,
      states: statesFilter,
      applications: applicationsFilter,
      roles: rolesFilter,
    },
    setQueryStates,
  ] = useQueryStates({
    search: parseAsString.withDefault(''),
    states: parseAsArrayOf(parseAsString, ',').withDefault([]),
    applications: parseAsArrayOf(parseAsString, ',').withDefault([]),
    roles: parseAsArrayOf(parseAsString, ',').withDefault(DEFAULT_ROLES_FILTER),
  })

  const hasNoFiltersApplied =
    searchFilter.length === 0 &&
    statesFilter.length === 0 &&
    applicationsFilter.length === 0 &&
    isEqual(rolesFilter, DEFAULT_ROLES_FILTER)

  const { data, isPending, isSuccess } = useDatabaseActivityQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )

  const { data: roles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const matchesSearch = (activity: { query: string | null }) =>
    !searchFilter || (activity.query?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false)

  const activities = data?.filter((activity) => {
    const matchesState =
      !statesFilter ||
      statesFilter.length === 0 ||
      (activity.state !== null && statesFilter.includes(activity.state))
    const matchesRole = rolesFilter.length === 0 || rolesFilter.includes(activity.role_name)
    const matchesApplication =
      applicationsFilter.length === 0 || applicationsFilter.includes(activity.application_name)
    return matchesState && matchesRole && matchesApplication && matchesSearch(activity)
  })

  const stateOptions = [
    'Idle',
    'Active',
    'Idle in transaction',
    'Idle in transaction (aborted)',
    'Fastpath function call',
    'Disabled',
  ].map((x) => ({
    label: x,
    value: x.toLowerCase(),
    quantity: data?.filter(
      (y) =>
        y.state === x.toLowerCase() &&
        (rolesFilter.length === 0 || rolesFilter.includes(y.role_name)) &&
        (applicationsFilter.length === 0 || applicationsFilter.includes(y.application_name)) &&
        matchesSearch(y)
    ).length,
  }))

  const applicationOptions = Array.from(new Set(data?.map((x) => x.application_name) ?? []))
    .sort()
    .map((x) => ({
      label: x,
      value: x,
      quantity: data?.filter(
        (y) =>
          y.application_name === x &&
          (rolesFilter.length === 0 || rolesFilter.includes(y.role_name)) &&
          (!statesFilter ||
            statesFilter.length === 0 ||
            (y.state !== null && statesFilter.includes(y.state))) &&
          matchesSearch(y)
      ).length,
    }))
    .filter((x) => !!x.value)

  const priorityRoles = ['anon', 'authenticated', 'postgres']

  const roleOptions = (roles ?? [])
    .map((x) => ({
      label: x.name,
      value: x.name,
      quantity: data?.filter(
        (y) =>
          y.role_name === x.name &&
          (!statesFilter ||
            statesFilter.length === 0 ||
            (y.state !== null && statesFilter.includes(y.state))) &&
          (applicationsFilter.length === 0 || applicationsFilter.includes(y.application_name)) &&
          matchesSearch(y)
      ).length,
    }))
    .sort((a, b) => {
      const aIndex = priorityRoles.indexOf(a.value)
      const bIndex = priorityRoles.indexOf(b.value)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return 0
    })

  const onResetFilters = () => {
    setQueryStates({
      search: '',
      states: [],
      roles: DEFAULT_ROLES_FILTER,
      applications: [],
    })
  }

  useEffect(() => {
    if (selectedPid && isSuccess) {
      document
        .getElementById(selectedPid.toString())
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedPid, isSuccess])

  return (
    <div className="flex flex-col gap-y-4">
      <h2>Sessions</h2>
      <div className="flex gap-x-2">
        <Input
          size="tiny"
          icon={<Search />}
          placeholder="Search query"
          className="w-64"
          value={searchFilter}
          onChange={(e) => setQueryStates({ search: e.target.value })}
        />
        <ReportsSelectFilter
          label="State"
          options={stateOptions}
          value={statesFilter ?? []}
          onChange={(states) => setQueryStates({ states })}
          isLoading={isPending}
          popoverClassName="w-60"
        />
        <ReportsSelectFilter
          showSearch
          label="Roles"
          options={roleOptions}
          value={rolesFilter ?? []}
          onChange={(roles) => setQueryStates({ roles })}
          isLoading={isPending}
          popoverClassName="w-72"
        />
        <ReportsSelectFilter
          showSearch
          label="Application"
          options={applicationOptions}
          value={applicationsFilter ?? []}
          onChange={(applications) => setQueryStates({ applications })}
          isLoading={isPending}
          popoverClassName="w-60"
        />
        {!hasNoFiltersApplied && (
          <ButtonTooltip
            variant="text"
            className="px-1"
            icon={<X />}
            onClick={onResetFilters}
            aria-label="Reset filters"
            tooltip={{ content: { side: 'bottom', text: 'Reset filters' } }}
          />
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">State</TableHead>
              <TableHead className="max-w-[300px]">Query · Session</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Blocked by</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ShimmeringLoader />
                  </TableCell>
                  <TableCell>
                    <ShimmeringLoader />
                  </TableCell>
                  <TableCell>
                    <ShimmeringLoader />
                  </TableCell>
                  <TableCell colSpan={2}>
                    <ShimmeringLoader />
                  </TableCell>
                </TableRow>
              ))
            ) : (activities ?? []).length === 0 ? (
              <TableRow>
                {hasNoFiltersApplied ? (
                  <TableCell colSpan={5}>
                    <p className="text-sm text-foreground">No active sessions</p>
                    <p className="text-sm text-foreground-lighter mt-1">
                      There are currently no active database connections for the anon,
                      authenticated, and postgres roles.
                    </p>
                  </TableCell>
                ) : (
                  <TableCell colSpan={5}>
                    <p className="text-sm text-foreground">No results found</p>
                    <p className="text-sm text-foreground-lighter mt-1">
                      There are no sessions that match the selected filters. Try adjusting or
                      clearing them.
                    </p>
                    <Button variant="default" className="mt-2" onClick={onResetFilters}>
                      Reset filters
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ) : null}

            {activities?.map((activity) => (
              <ActivityRow key={activity.pid} activity={activity} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
