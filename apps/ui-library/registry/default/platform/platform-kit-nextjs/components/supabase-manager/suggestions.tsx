'use client'

import { Terminal } from 'lucide-react'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Badge } from '@/registry/default/components/ui/badge'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { useGetSuggestions } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-suggestions'

export function SuggestionsManager({ projectRef }: { projectRef: string }) {
  const { data: suggestions, isLoading, error } = useGetSuggestions(projectRef)

  const sortedSuggestions = useMemo(() => {
    if (!suggestions) return []
    const levelOrder = { ERROR: 1, WARN: 2, INFO: 3 }
    return [...suggestions].sort((a: any, b: any) => {
      const levelA = levelOrder[a.level as keyof typeof levelOrder] || 99
      const levelB = levelOrder[b.level as keyof typeof levelOrder] || 99
      return levelA - levelB
    })
  }, [suggestions])

  const getBadgeVariant = (level: 'ERROR' | 'WARN' | 'INFO') => {
    switch (level) {
      case 'ERROR':
        return 'destructive'
      case 'WARN':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="p-6 pt-4 lg:p-12 lg:pt-12 max-w-3xl mx-auto">
      <h2 className="text-base lg:text-xl font-semibold mb-1">Suggestions</h2>
      <p className="text-muted-foreground mb-4 lg:mb-8 text-sm lg:text-base">
        Improve your project&apos;s security and performance.
      </p>
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mt-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error fetching suggestions</AlertTitle>
          <AlertDescription>
            {(error as any)?.message || 'An unexpected error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      {suggestions && (
        <div>
          {sortedSuggestions.length > 0 ? (
            <div>
              {sortedSuggestions.map((suggestion: any) => (
                <div
                  key={suggestion.cache_key}
                  className="py-4 border-b last:border-b-0 group relative"
                >
                  <div className="flex-1">
                    <div className="flex justify-start items-start gap-4">
                      <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                      <div className="flex items-center gap-1">
                        <Badge variant={getBadgeVariant(suggestion.level)} className="shrink-0">
                          {suggestion.level}
                        </Badge>
                        {suggestion.type && (
                          <Badge
                            variant={suggestion.type === 'security' ? 'destructive' : 'secondary'}
                            className="shrink-0"
                          >
                            {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ inline, children, ...props }: any) {
                            return inline ? (
                              <code className="bg-muted px-1 rounded" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-muted p-2 rounded overflow-x-auto" {...props}>
                                <code>{children}</code>
                              </pre>
                            )
                          },
                        }}
                      >
                        {suggestion.detail}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>No suggestions found</AlertTitle>
              <AlertDescription>
                Your project looks good! No suggestions at this time.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
