import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

/** Docs links shown in the header of the scoped token sheets. */
export const TokenDocsButtons = () => {
  return (
    <div className="flex items-center gap-2">
      <DocsButton
        href={`${DOCS_URL}/guides/platform/personal-access-tokens`}
        topic="Personal access tokens"
        label="Personal access tokens docs"
      />
      <DocsButton
        href={`${DOCS_URL}/guides/platform/access-control`}
        topic="Access control"
        label="Access control docs"
      />
    </div>
  )
}
