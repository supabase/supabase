export const PROJECT_LIST_SORT_VALUES = [
  'name_asc',
  'name_desc',
  'created_desc',
  'created_asc',
] as const

export type ProjectListSort = (typeof PROJECT_LIST_SORT_VALUES)[number]
export type ProjectListSortableColumn = 'name' | 'created'

export const PROJECT_LIST_SORT_LABELS: Record<ProjectListSort, string> = {
  name_asc: 'Project name (A–Z)',
  name_desc: 'Project name (Z–A)',
  created_desc: 'Creation date (Newest first)',
  created_asc: 'Creation date (Oldest first)',
}

export const getProjectListSortButtonLabel = (value: ProjectListSort) => {
  if (value.startsWith('created')) return 'creation date'
  return 'name'
}

export const toTableHeadSortValue = (sort: ProjectListSort) => sort.replace('_', ':')

export const getNextProjectListSortForColumn = (
  currentSort: ProjectListSort,
  column: ProjectListSortableColumn
): ProjectListSort => {
  if (column === 'name') {
    if (currentSort === 'name_asc') return 'name_desc'
    if (currentSort === 'name_desc') return 'name_asc'
    return 'name_asc'
  }

  if (currentSort === 'created_desc') return 'created_asc'
  if (currentSort === 'created_asc') return 'created_desc'
  return 'created_desc'
}

export const getProjectListAriaSort = (
  currentSort: ProjectListSort,
  column: ProjectListSortableColumn
): 'ascending' | 'descending' | 'none' => {
  if (column === 'name') {
    if (currentSort === 'name_asc') return 'ascending'
    if (currentSort === 'name_desc') return 'descending'
    return 'none'
  }

  if (currentSort === 'created_asc') return 'ascending'
  if (currentSort === 'created_desc') return 'descending'
  return 'none'
}
