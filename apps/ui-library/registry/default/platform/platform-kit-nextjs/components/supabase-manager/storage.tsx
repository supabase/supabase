'use client'

import { AlertTriangle, Folder } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Badge } from '@/registry/default/components/ui/badge'
import { Button } from '@/registry/default/components/ui/button'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/default/components/ui/tooltip'
import { useGetBuckets } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-storage'

export function StorageManager({ projectRef }: { projectRef: string }) {
  const { data: buckets, isLoading, isError } = useGetBuckets(projectRef)

  return (
    <div className="p-6 pt-4 lg:p-8 lg:pt-8">
      <h1 className="text-base lg:text-xl font-semibold">Storage</h1>
      <p className="hidden lg:block text-sm lg:text-base text-muted-foreground mt-1">
        View and manage the files stored in your app.
      </p>

      {isLoading && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {isError && (
        <Alert variant="destructive" className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading buckets</AlertTitle>
          <AlertDescription>There was a problem loading your storage buckets.</AlertDescription>
        </Alert>
      )}

      {buckets && buckets.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket: any) => (
            <Tooltip key={bucket.id}>
              <TooltipTrigger asChild>
                <Button
                  key={bucket.id}
                  variant="outline"
                  className="flex-row justify-start text-left h-auto p-4 gap-4"
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <h2 className="font-semibold mb-1">{bucket.name}</h2>

                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(bucket.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={bucket.public ? 'default' : 'secondary'}>
                    {bucket.public ? 'Public' : 'Private'}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Viewing files is coming soon</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : buckets && buckets.length === 0 ? (
        <Alert className="mt-8">
          <Folder className="h-4 w-4" />
          <AlertTitle>No storage buckets</AlertTitle>
          <AlertDescription>
            A bucket is a container used to store and protect files in your app.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
