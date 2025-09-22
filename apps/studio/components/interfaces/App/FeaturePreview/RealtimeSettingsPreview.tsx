import Image from 'next/image'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { BASE_PATH } from 'lib/constants'
import { useIsRealtimeSettingsEnabled } from './FeaturePreviewContext'

export const RealtimeSettingsPreview = () => {
  const { ref } = useParams()
  const isRealtimeSettingsEnabled = useIsRealtimeSettingsEnabled()

  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Allows you to setup several configurations for Realtime, including configuration channel
        restrictions where you can enable or disable public channels from being able to connect.
        Learn more about how Realtime Authorization works{' '}
        <InlineLink href="https://supabase.com/docs/guides/realtime/authorization">
          in our documentation
        </InlineLink>
        .
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/realtime-settings-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded border mb-4"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Allow you to configure realtime settings for your project from the{' '}
            <InlineLink
              href={
                isRealtimeSettingsEnabled
                  ? `/project/${ref}/realtime/settings`
                  : `/project/${ref}/realtime/inspector`
              }
            >
              realtime section.
            </InlineLink>
          </li>
        </ul>
      </div>
    </div>
  )
}
