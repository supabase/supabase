import { CLIENT_LIBRARIES } from 'common'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { Button } from 'ui'

interface LibrarySuggestionsProps {
  library: string
}

export const LibrarySuggestions = ({ library }: LibrarySuggestionsProps) => {
  const selectedLibrary = CLIENT_LIBRARIES.find((lib) => lib.language === library)
  const selectedClientLibraries = selectedLibrary?.libraries.filter((library) =>
    library.name.includes('supabase-')
  )
  return (
    <div className="px-6 flex flex-col gap-y-4">
      <div className="space-y-2">
        <p className="text-sm text-foreground-light">
          Found an issue or a bug? Try searching our Github issues or submit a new one.
        </p>
      </div>
      <div className="flex items-center space-x-4 overflow-x-auto">
        {selectedClientLibraries?.map((lib) => {
          const libraryLanguage = library === 'Dart (Flutter)' ? lib.name.split('-')[1] : library
          return (
            <div
              key={lib.name}
              className="w-[230px] min-w-[230px] min-h-[128px] rounded border border-control bg-surface-100 space-y-3 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm">{lib.name}</p>
                <p className="text-sm text-foreground-light">
                  For issues regarding the {libraryLanguage} client library
                </p>
              </div>
              <div>
                <Button asChild type="default" icon={<ExternalLink size={14} strokeWidth={1.5} />}>
                  <Link href={lib.url} target="_blank" rel="noreferrer">
                    View Github issues
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
        <div
          className={[
            'px-4 py-3 rounded border border-control bg-surface-100',
            'w-[230px] min-w-[230px] min-h-[128px] flex flex-col justify-between space-y-3',
          ].join(' ')}
        >
          <div className="space-y-1">
            <p className="text-sm">supabase</p>
            <p className="text-sm text-foreground-light">For any issues about our API</p>
          </div>
          <div>
            <Button asChild type="default" icon={<ExternalLink size={14} strokeWidth={1.5} />}>
              <Link href="https://github.com/supabase/supabase" target="_blank" rel="noreferrer">
                View Github issues
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
