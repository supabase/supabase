import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const UnifiedLogsPreview = () => {
  const { ref } = useParams()

  return (
    <div className="space-y-2">
      <p className="text-foreground-light text-sm mb-4">
        Experience our enhanced Logs interface with improved filtering, real-time updates, and a
        unified view across all your services. Built for better performance and easier debugging.
      </p>
      <p className="text-foreground-light text-sm mb-4">
        This interface will only be available for organizations on the Team plan or above.
      </p>
      <Image
        alt="new-logs-preview"
        src={`${BASE_PATH}/img/previews/new-logs-preview.png`}
        width={1296}
        height={900}
        className="rounded border mb-4"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Replace the current Logs interface on the{' '}
            <InlineLink href={`/project/${ref}/logs`}>Logs page</InlineLink> with a unified view
          </li>
          <li>Provide enhanced filtering capabilities and real-time log streaming</li>
          <li>Improve performance with optimized data loading and virtualization</li>
          <li>Offer a more modern interface with better search and navigation</li>
        </ul>
      </div>
    </div>
  )
}
