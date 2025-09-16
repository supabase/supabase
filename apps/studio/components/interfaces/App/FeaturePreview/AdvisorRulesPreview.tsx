import Image from 'next/image'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { BASE_PATH } from 'lib/constants'
import { useIsRealtimeSettingsEnabled } from './FeaturePreviewContext'

export const AdvisorRulesPreview = () => {
  const { ref } = useParams()
  const isRealtimeSettingsEnabled = useIsRealtimeSettingsEnabled()

  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Disable specific Advisor categories or rules to prevent them from showing up in Advisor
        reports or email notifications. This could be useful for rules that might not be applicable
        to your project.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/advisor-rule-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded border mb-4"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Allow you to disable advisor rules for your project from the{' '}
            <InlineLink
              href={
                isRealtimeSettingsEnabled
                  ? `/project/${ref}/advisors/security`
                  : `/project/${ref}/advisors/rules/security`
              }
            >
              Advisors section.
            </InlineLink>
          </li>
        </ul>
      </div>
    </div>
  )
}
