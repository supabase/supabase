import { toast } from 'sonner'

import { NO_PROJECT_MARKER } from './SupportForm.utils'
import CopyButton from '@/components/ui/CopyButton'

interface SupportFormDirectEmailContentProps {
  projectRef: string | null
}

export function SupportFormDirectEmailContent({ projectRef }: SupportFormDirectEmailContentProps) {
  const hasProjectRef = projectRef && projectRef !== NO_PROJECT_MARKER

  return (
    <div className="text-sm text-foreground-light">
      <p className="flex items-center gap-x-1.5 flex-wrap">
        Please email us directly at
        <span className="inline-flex items-center gap-x-1">
          <a
            href={`mailto:support@supabase.com?subject=${encodeURIComponent('Support Request')}${hasProjectRef ? `${encodeURIComponent(' for Project ID: ')}${encodeURIComponent(projectRef)}` : ''}&body=${encodeURIComponent('Here is a detailed description of the problem I am experiencing and any other information that might be helpful...')}`}
            className="hover:text-foreground transition-colors duration-100"
          >
            <code className="text-code-inline !text-foreground-light underline decoration-foreground-lighter/50 hover:decoration-foreground-lighter/80 transition-colors duration-100">
              support@supabase.com
            </code>
          </a>
          <CopyButton
            type="text"
            text="support@supabase.com"
            iconOnly
            onClick={() => toast.success('Copied email address to clipboard')}
          />
        </span>{' '}
        and include as much information as possible
        {hasProjectRef && (
          <>
            , along with project ID
            <span className="inline-flex items-center gap-x-1">
              <code className="text-code-inline !text-foreground-light">{projectRef}</code>
              <CopyButton
                iconOnly
                type="text"
                text={projectRef}
                onClick={() => toast.success('Copied project ID to clipboard')}
              />
            </span>
          </>
        )}
        .
      </p>
    </div>
  )
}
