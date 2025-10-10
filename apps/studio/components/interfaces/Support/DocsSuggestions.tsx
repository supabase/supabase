import { Book, Github, Loader2 } from 'lucide-react'

import { useDocsSearch, type DocsSearchResult } from 'common'
import { useChangedSync } from 'hooks/misc/useChanged'
import { DOCS_URL } from 'lib/constants'
import { cn } from 'ui'

function useDocsSuggestions(subject: string) {
  const { handleDocsSearchDebounced, resetSearch, searchState } = useDocsSearch()

  const trimmedSubject = subject.trim()
  const subjectChanged = useChangedSync(trimmedSubject)

  if (subjectChanged && trimmedSubject) {
    handleDocsSearchDebounced(trimmedSubject)
  } else if (subjectChanged && !trimmedSubject) {
    resetSearch()
  }

  return searchState
}

interface DocsSuggestionsProps {
  searchString: string
}

export function DocsSuggestions({ searchString }: DocsSuggestionsProps) {
  const searchState = useDocsSuggestions(searchString)
  const results =
    'results' in searchState
      ? searchState.results
      : 'staleResults' in searchState
        ? searchState.staleResults
        : []
  const resultsStale = searchState.status === 'loading'

  return (
    <>
      {searchState.status === 'loading' && <DocsSuggestions_Loading />}
      {results.length > 0 && <DocsSuggestions_Results results={results} isStale={resultsStale} />}
    </>
  )
}

function DocsSuggestions_Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground-light">
      <Loader2 className="animate-spin" size={14} />
      <span>Searching for relevant resources...</span>
    </div>
  )
}

interface DocsSuggestions_ResultsProps {
  results: DocsSearchResult[]
  isStale: boolean
}

function DocsSuggestions_Results({ results, isStale }: DocsSuggestions_ResultsProps) {
  return (
    <ul
      className={cn(
        'flex flex-col gap-y-0.5 transition-opacity duration-200',
        isStale ? 'opacity-50' : 'opacity-100'
      )}
    >
      {results.slice(0, 5).map((page) => {
        return (
          <li key={page.id} className="flex items-center gap-x-1">
            {page.type === 'github-discussions' ? (
              <Github size={16} className="text-foreground-muted" />
            ) : (
              <Book size={16} className="text-foreground-muted" />
            )}
            <a
              href={page.type === 'github-discussions' ? page.path : `${DOCS_URL}${page.path}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-foreground-light hover:text-foreground transition"
            >
              {page.title}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
