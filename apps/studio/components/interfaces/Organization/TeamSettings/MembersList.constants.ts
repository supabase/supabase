// Shared by the header and every row so the columns line up without table layout
export const MEMBERS_GRID_CLASS =
  'grid grid-cols-[minmax(0,400px)_120px_minmax(0,1fr)_200px] items-center gap-x-4 px-4'

// Row heights are fixed because the virtualized list doesn't measure rows
export const MEMBER_ROW_MIN_HEIGHT = 60
export const MEMBER_ROLE_LINE_HEIGHT = 20

export const MFA_FILTER_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'enabled', label: 'MFA enabled' },
  { value: 'disabled', label: 'MFA disabled' },
] as const

export type MfaFilter = (typeof MFA_FILTER_OPTIONS)[number]['value']
