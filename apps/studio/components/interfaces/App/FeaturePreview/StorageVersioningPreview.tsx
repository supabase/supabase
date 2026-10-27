import { useParams } from 'common'

import { InlineLink } from '@/components/ui/InlineLink'

export const StorageVersioningPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light mb-4">
        Object versioning keeps a noncurrent copy of a file every time it's overwritten or archived,
        so accidental changes and deletes stay recoverable. Preview, compare and restore any earlier
        version from the file preview panel, and use lifecycle policies to expire noncurrent
        versions automatically and keep storage costs in check.
      </p>
      {/* TODO: storage-versioning-preview.png (1296x900) */}

      <div className="space-y-2 mt-4!">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Add an Object versioning toggle and lifecycle policy settings to each bucket in{' '}
            <InlineLink href={`/project/${ref}/storage/files`}>Storage</InlineLink>
          </li>
          <li>
            Show a version history in the file preview panel, where you can compare an earlier
            version against the current one and restore it
          </li>
          <li>
            Archive files instead of deleting them in versioned buckets, so you can bring them back
            from Show archived
          </li>
          <li>
            Let you expire noncurrent versions automatically by age, by how many to keep, or both
          </li>
        </ul>
      </div>

      <p className="text-sm text-foreground-light mt-4!">
        Object versioning is in <em>Private Alpha</em>. It stays off for every bucket until you turn
        it on, and turning it off later suspends it without removing the versions you already have.
      </p>
    </div>
  )
}
