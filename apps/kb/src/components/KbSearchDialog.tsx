import { useDocsSearchV2 } from 'common/hooks/useDocsSearchV2'
import { SearchDialog, SearchPanel, type SearchLabels } from 'docs-search/components'

import { KB_SEARCH_URL, reshapeKbResult } from '../lib/search'

export interface KbSearchDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const LABELS: Partial<SearchLabels> = {
  dialogTitle: 'Search the knowledge base',
  dialogDescription: 'Search guides and troubleshooting articles',
  inputPlaceholder: 'Search guides...',
  inputLabel: 'Search the knowledge base',
  searching: 'Searching the knowledge base…',
  noResults: 'No results found. Try a shorter or different term.',
  error: 'Search failed. Check your connection and try again.',
}

export const KbSearchDialog = ({ isOpen, onOpenChange }: KbSearchDialogProps) => (
  <SearchDialog open={isOpen} onOpenChange={onOpenChange} labels={LABELS}>
    <KbSearchPanel onOpenChange={onOpenChange} />
  </SearchDialog>
)

// mounted only while the dialog is open, so closing it drops the search state
const KbSearchPanel = ({ onOpenChange }: Pick<KbSearchDialogProps, 'onOpenChange'>) => {
  const { searchState, handleDocsSearchDebounced, resetSearch } = useDocsSearchV2({
    endpoint: KB_SEARCH_URL,
    reshape: reshapeKbResult,
  })

  return (
    <SearchPanel
      searchState={searchState}
      labels={LABELS}
      onQueryChange={(query) => (query ? handleDocsSearchDebounced(query) : resetSearch())}
      onResultNavigate={(path) => window.location.assign(path)}
      onResultLinkNavigate={() => onOpenChange(false)}
    />
  )
}
