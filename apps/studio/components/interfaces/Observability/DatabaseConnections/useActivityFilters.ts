import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

export const DEFAULT_ROLES_FILTER = ['anon', 'authenticated', 'postgres']

export const EMPTY_ACTIVITY_FILTERS = {
  search: '',
  states: [] as string[],
  applications: [] as string[],
  roles: [] as string[],
  view: '',
}

// URL-backed so the Sessions table (Activity.tsx) and anything that selects a pid (Overview.tsx,
// ActivityRow.tsx) read/write the same filter state without prop drilling.
export const useActivityFilters = () => {
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    states: parseAsArrayOf(parseAsString, ',').withDefault([]),
    applications: parseAsArrayOf(parseAsString, ',').withDefault([]),
    roles: parseAsArrayOf(parseAsString, ',').withDefault(DEFAULT_ROLES_FILTER),
    view: parseAsString.withDefault(''),
  })

  return { filters, setFilters }
}
