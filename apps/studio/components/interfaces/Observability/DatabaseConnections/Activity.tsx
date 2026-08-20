import { isEqual } from 'lodash'
import { Search, X } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ReportsSelectFilter } from '../../Reports/v2/ReportsSelectFilter'
import { GroupedActivityRow } from './ActivityRow'
import { filterActivities } from './DatabaseConnections.utils'
import { DEFAULT_ROLES_FILTER, useActivityFilters } from './useActivityFilters'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery } from '@/data/database/activity-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

interface ActivityProps {
  live?: boolean
}

export const Activity = ({ live }: ActivityProps) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const {
    filters: {
      search: searchFilter,
      states: statesFilter,
      applications: applicationsFilter,
      roles: rolesFilter,
      view: viewFilter,
    },
    setFilters: setQueryStates,
  } = useActivityFilters()

  const hasNoFiltersApplied =
    searchFilter.length === 0 &&
    statesFilter.length === 0 &&
    applicationsFilter.length === 0 &&
    isEqual(rolesFilter, DEFAULT_ROLES_FILTER) &&
    viewFilter === ''

  const { data, isPending } = useDatabaseActivityQuery(
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

  // Pids referenced in some other activity's blocked_by - i.e. they are blocking something
  const blockingPids = new Set((data ?? []).flatMap((x) => x.blocked_by))

  const activities = data
    ? filterActivities(data, {
        search: searchFilter,
        states: statesFilter,
        applications: applicationsFilter,
        roles: rolesFilter,
        view: viewFilter,
      })
    : undefined
  const rootBlockers = (data ?? []).filter(
    (x) =>
      x.blocked_by.length === 0 &&
      blockingPids.has(x.pid) &&
      (rolesFilter.length === 0 || rolesFilter.includes(x.role_name))
  )

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
        (viewFilter !== 'blockers' || y.blocked_by.length > 0) &&
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
          (viewFilter !== 'blockers' || y.blocked_by.length > 0) &&
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
          (viewFilter !== 'blockers' || y.blocked_by.length > 0) &&
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
    track('database_connections_filter_updated', { type: 'reset' })
    setQueryStates({
      search: '',
      states: [],
      roles: DEFAULT_ROLES_FILTER,
      applications: [],
      view: '',
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <h2>Sessions</h2>
      <div className="flex gap-2 flex-wrap">
        <Input
          size="tiny"
          icon={<Search />}
          placeholder="Search query"
          className="w-56"
          value={searchFilter}
          onChange={(e) => setQueryStates({ search: e.target.value })}
        />
        <ReportsSelectFilter
          label="State"
          options={stateOptions}
          value={statesFilter ?? []}
          onChange={(states) => {
            if (isEqual(states, statesFilter)) return
            track('database_connections_filter_updated', { type: 'state' })
            setQueryStates({ states })
          }}
          isLoading={isPending}
          popoverClassName="w-60"
        />
        <ReportsSelectFilter
          showSearch
          label="Roles"
          options={roleOptions}
          value={rolesFilter ?? []}
          onChange={(roles) => {
            if (isEqual(roles, rolesFilter)) return
            track('database_connections_filter_updated', { type: 'roles' })
            setQueryStates({ roles })
          }}
          isLoading={isPending}
          popoverClassName="w-72"
        />
        <ReportsSelectFilter
          showSearch
          label="Application"
          options={applicationOptions}
          value={applicationsFilter ?? []}
          onChange={(applications) => {
            if (isEqual(applications, applicationsFilter)) return
            track('database_connections_filter_updated', { type: 'application' })
            setQueryStates({ applications })
          }}
          isLoading={isPending}
          popoverClassName="w-60"
        />
        <ButtonTooltip
          variant={viewFilter === 'blockers' ? 'default' : 'dashed'}
          iconRight={rootBlockers.length > 0 ? <span>{rootBlockers.length}</span> : null}
          onClick={() => {
            track('database_connections_blocker_view_clicked', {
              newState: viewFilter === 'blockers' ? 'disabled' : 'enabled',
            })
            setQueryStates({ view: viewFilter === 'blockers' ? '' : 'blockers' })
          }}
          tooltip={{
            content: {
              side: 'bottom',
              text: 'Shows queries currently blocking others',
            },
          }}
        >
          Root blockers
        </ButtonTooltip>
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
              <GroupedActivityRow key={activity.pid} activity={activity} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
