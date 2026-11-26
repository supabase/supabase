import { useParams } from 'common'
import Image from 'next/image'
import { Admonition } from 'ui-patterns/Admonition'
import { BASE_PATH } from 'ui-patterns/CommandMenu/prepackaged/shared/constants'

import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

export const StorageVersioningPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light mb-4">
        Storage object versioning keeps a noncurrent copy of a file every time it's overwritten or
        archived. Preview, compare and restore any earlier version from the file preview panel, and
        use lifecycle policies to expire noncurrent versions automatically.
      </p>
      <Admonition
        type="warning"
        title="Storage Object Versioning and Lifecycle Policies are in Public Alpha"
        description="This feature may change during development and is not recommended for production workloads."
      />
      <Image
        src={`${BASE_PATH}/img/previews/storage-object-versioning.png`}
        width={1296}
        height={900}
        alt="storage object versioning settings and version history preview"
        className="rounded-sm border mt-4"
      />
      <div className="space-y-2 my-4!">
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
            if needed
          </li>
          <li>
            Let you expire noncurrent versions automatically by age, by how many to keep, or both
          </li>
        </ul>
      </div>
      <hr />
      <div className="space-y-2 mt-4!">
        <h4 className="text-sm">Storage usage and retained versions</h4>
        <p className="text-sm text-foreground-light">
          Retained versions count toward Storage usage and may increase your bill. Set a lifecycle
          policy to expire versions you no longer need. Disabling object versioning on a versioned
          bucket suspends it but retains its existing versions.
        </p>
      </div>
      <DocsButton href={`${DOCS_URL}/guides/platform/manage-your-usage/storage-versioning`} />
    </div>
  )
}
