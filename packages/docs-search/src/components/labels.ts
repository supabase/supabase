import type { SearchLabels } from './types'

export const DEFAULT_SEARCH_LABELS: SearchLabels = {
  dialogTitle: 'Search docs',
  dialogDescription: 'Search the Supabase documentation',
  inputPlaceholder: 'Search docs...',
  inputLabel: 'Search the Supabase documentation',
  resultsLabel: 'Search results',
  clear: 'Clear',
  searching: 'Searching the docs…',
  noResults: 'No results found.',
  error: 'Something went wrong. Please try again.',
  resultCount: (count) => `${count} result${count === 1 ? '' : 's'} found.`,
  navigate: 'Navigate',
  open: 'Open',
}

export function resolveSearchLabels(labels?: Partial<SearchLabels>): SearchLabels {
  return { ...DEFAULT_SEARCH_LABELS, ...labels }
}
