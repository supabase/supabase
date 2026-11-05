import { useParams } from 'common'
import Image from 'next/image'

import { useIsAdvisorRulesEnabled } from './FeaturePreviewContext'
import { InlineLink } from '@/components/ui/InlineLink'
import { BASE_PATH } from '@/lib/constants'

export const AdvisorRulesPreview = () => {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">
        Turn off specific checks or categories to stop them showing up in Issues or email
        notifications. This could be useful for checks that might not apply to your project.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/advisor-rule-preview.png`}
        width={1296}
        height={900}
        alt="api-docs-side-panel-preview"
        className="rounded-sm border mb-4"
      />
      <div className="space-y-2 mt-4!">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Allow you to disable advisor rules for your project from the{' '}
            <InlineLink
              href={
                isAdvisorRulesEnabled
                  ? `/project/${ref}/advisors/rules/security`
                  : `/project/${ref}/issues?category=security`
              }
            >
              Issues section.
            </InlineLink>
          </li>
        </ul>
      </div>
    </div>
  )
}
