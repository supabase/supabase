export const PROJECT_LIST_SORT_VALUES = [
  'name_asc',
  'name_desc',
  'created_desc',
  'created_asc',
] as const

export type ProjectListSort = (typeof PROJECT_LIST_SORT_VALUES)[number]

export const toTableHeadSortValue = (sort: ProjectListSort) => sort.replace('_', ':')

export const getNextProjectListSortForColumn = (currentSort: ProjectListSort): ProjectListSort => {
  if (currentSort.includes('asc')) return currentSort.replace('asc', 'desc') as ProjectListSort
  if (currentSort.includes('desc')) return currentSort.replace('desc', 'asc') as ProjectListSort
  return 'name_asc'
}

export const getProjectListAriaSort = (
  currentSort: ProjectListSort
): 'ascending' | 'descending' | 'none' => {
  if (currentSort.includes('asc')) return 'ascending'
  if (currentSort.includes('desc')) return 'descending'
  return 'none'
}
