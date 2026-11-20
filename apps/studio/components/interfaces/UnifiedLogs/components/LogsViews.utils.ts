export const MIN_FILTERS_TO_SAVE = 1

export const VIEW_NAME_MAX_LENGTH = 64

export const isDuplicateViewName = (name: string, existingNames: string[]): boolean => {
  const normalized = name.trim().toLowerCase()
  return existingNames.some((existing) => existing.trim().toLowerCase() === normalized)
}

const MAX_VIEW_NAME_IN_COPY = 32

export const truncateViewName = (name: string): string =>
  name.length <= MAX_VIEW_NAME_IN_COPY
    ? name
    : `${name.slice(0, MAX_VIEW_NAME_IN_COPY - 1).trimEnd()}…`

export const getFilterCombinationKey = (filter: string[] | null | undefined): string => {
  if (!filter || filter.length === 0) return ''
  return JSON.stringify([...filter].sort())
}

interface GetViewModifiedDescriptionParams {
  viewName: string
  isPreset: boolean
  canCreate: boolean
  canUpdate: boolean
}

export const getViewModifiedDescription = ({
  viewName,
  isPreset,
  canCreate,
  canUpdate,
}: GetViewModifiedDescriptionParams): string => {
  if (isPreset) {
    if (canCreate) {
      return "Preset views can't be updated. Save these filters as a new view instead."
    } else {
      return "Preset views can't be updated. Reset to discard these filters."
    }
  } else if (canUpdate) {
    return `Update "${truncateViewName(viewName)}" for everyone in the project, or save these filters as a new view.`
  } else {
    return 'These filters have not been saved.'
  }
}
