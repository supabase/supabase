import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'

export const AdvisorsV2Preview = () => {
  const { ref } = useParams()

  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Replace the legacy Security and Performance Advisor pages with the new unified Advisors
        experience. All existing lint checks are preserved and displayed in the Advisors Overview
        alongside persistent issues, AI agents, and notification channels.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Hide the separate Security and Performance Advisor pages from the sidebar
          </li>
          <li>
            Show all lint findings in the{' '}
            <InlineLink href={`/project/${ref}/advisors`}>Advisors Overview</InlineLink>
          </li>
          <li>
            Provide a unified view combining lint checks with persistent issues, AI agents, and
            configurable notification channels
          </li>
        </ul>
      </div>
    </div>
  )
}
