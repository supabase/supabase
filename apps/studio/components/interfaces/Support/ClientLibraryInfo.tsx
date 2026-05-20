// End of third-party imports

import { CLIENT_LIBRARIES } from 'common/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  cn,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { ExtendedSupportCategories } from './Support.constants'
import type { SupportFormValues } from './SupportForm.schema'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface ClientLibraryInfoProps {
  form: UseFormReturn<SupportFormValues>
  category: ExtendedSupportCategories
  library: string | undefined
}

export function ClientLibraryInfo({ form, category, library }: ClientLibraryInfoProps) {
  const showClientLibraries = useIsFeatureEnabled('support:show_client_libraries')

  if (!showClientLibraries) return null
  if (category !== 'Problem') return null

  return (
    <div className="flex flex-col gap-y-1">
      <FormField
        name="library"
        control={form.control}
        render={({ field }) => (
          <FormItemLayout layout="vertical" label="Which library are you having issues with">
            <FormControl>
              <Select {...field} defaultValue={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-label="Select a library">
                  <SelectValue placeholder="Select a library" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CLIENT_LIBRARIES.map((option) => (
                      <SelectItem key={option.language} value={option.language}>
                        {option.language}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItemLayout>
        )}
      />
      {library && library.length > 0 && <LibrarySuggestions library={library} />}
    </div>
  )
}

interface LibrarySuggestionsProps {
  library: string
}

const LibrarySuggestions = ({ library }: LibrarySuggestionsProps) => {
  const selectedLibrary = CLIENT_LIBRARIES.find((lib) => lib.language === library)
  const selectedClientLibraries = selectedLibrary?.libraries.filter((library) =>
    library.name.includes('supabase-')
  )
  return (
    <div className="flex flex-col gap-y-4">
      <div className="space-y-2">
        <p className="text-sm text-foreground-light">
          Found an issue or a bug? Try searching our GitHub issues or submit a new one.
        </p>
      </div>
      <div className="flex items-center space-x-4 overflow-x-auto">
        {selectedClientLibraries?.map((lib) => {
          const libraryLanguage = library === 'Dart (Flutter)' ? lib.name.split('-')[1] : library
          return (
            <div
              key={lib.name}
              className="w-[230px] min-w-[230px] min-h-[128px] rounded-sm border border-control bg-surface-100 space-y-3 px-4 py-3"
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
                    View GitHub issues
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
        <div
          className={cn(
            'px-4 py-3 rounded-sm border border-control bg-surface-100',
            'w-[230px] min-w-[230px] min-h-[128px] flex flex-col justify-between space-y-3'
          )}
        >
          <div className="space-y-1">
            <p className="text-sm">supabase</p>
            <p className="text-sm text-foreground-light">For any issues about our API</p>
          </div>
          <div>
            <Button asChild type="default" icon={<ExternalLink size={14} strokeWidth={1.5} />}>
              <Link href="https://github.com/supabase/supabase" target="_blank" rel="noreferrer">
                View GitHub issues
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
