import { useParams } from 'common'
import { Badge } from 'ui'

import { useQueryClient } from '@tanstack/react-query'
import { useBucketInfoQueryPreferCached } from 'data/storage/buckets-query'
import { formatBytes } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { DOCS_RESOURCE_CONTENT } from '../ProjectAPIDocs.constants'
import ResourceContent from '../ResourceContent'
import type { ContentProps } from './Content.types'

export const Bucket = ({ language, apikey, endpoint }: ContentProps) => {
  const queryClient = useQueryClient()
  const { ref } = useParams()

  const snap = useAppStateSnapshot()
  const resource = snap.activeDocsSection[1]

  const bucket = useBucketInfoQueryPreferCached(resource, ref)
  const allowedMimeTypes = bucket?.allowed_mime_types
  const maxFileSizeLimit = bucket?.file_size_limit

  if (bucket === undefined) return null

  return (
    <div className="divide-y">
      <div className="space-y-1 px-4 py-4">
        <div className="flex items-center space-x-2">
          <h2>{bucket.name}</h2>
          <Badge variant={bucket.public ? 'warning' : 'default'}>
            {bucket.public ? 'Public' : 'Private'}
          </Badge>
        </div>
        <p className="text-sm text-foreground-light">
          Allowed MIME types:{' '}
          {allowedMimeTypes === null
            ? 'All types are allowed'
            : (allowedMimeTypes ?? []).length === 0
              ? 'No types are allowed'
              : (allowedMimeTypes ?? []).length > 1
                ? (allowedMimeTypes ?? []).join(', ')
                : 'Unknown'}
        </p>
        <p className="text-sm text-foreground-light">
          Max file size limit:{' '}
          {maxFileSizeLimit === null ? 'No limit' : `${formatBytes(maxFileSizeLimit)}`}
        </p>
      </div>

      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.uploadFile}
        codeSnippets={DOCS_RESOURCE_CONTENT.uploadFile.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.deleteFiles}
        codeSnippets={DOCS_RESOURCE_CONTENT.deleteFiles.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.listFiles}
        codeSnippets={DOCS_RESOURCE_CONTENT.listFiles.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.downloadFile}
        codeSnippets={DOCS_RESOURCE_CONTENT.downloadFile.code({
          name: resource,
          apikey,
          endpoint,
        })}
      />
      {bucket.public ? (
        <ResourceContent
          selectedLanguage={language}
          snippet={DOCS_RESOURCE_CONTENT.retrievePublicURL}
          codeSnippets={DOCS_RESOURCE_CONTENT.retrievePublicURL.code({
            name: resource,
            apikey,
            endpoint,
          })}
        />
      ) : (
        <ResourceContent
          selectedLanguage={language}
          snippet={DOCS_RESOURCE_CONTENT.createSignedURL}
          codeSnippets={DOCS_RESOURCE_CONTENT.createSignedURL.code({
            name: resource,
            apikey,
            endpoint,
          })}
        />
      )}
    </div>
  )
}
