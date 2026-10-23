import { useParams } from 'common'
import { ArrowUpRightIcon } from 'lucide-react'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

/**
 * Not rendered as a menu: the Issues sidebar is the list itself. These entries back the
 * Issues navigation shortcuts, each opening the list filtered to one category.
 */
export const generateIssuesMenu = ({
  ref,
  isAdvisorRulesEnabled,
  isPlatform,
}: {
  ref: string | undefined
  isAdvisorRulesEnabled: boolean
  isPlatform: boolean
}): ProductMenuGroup[] => [
  {
    title: 'Issues',
    items: [
      {
        name: 'Security issues',
        key: 'security',
        url: `/project/${ref}/issues?category=security`,
        items: [],
        shortcutId: SHORTCUT_IDS.NAV_ADVISORS_SECURITY,
      },
      {
        name: 'Performance issues',
        key: 'performance',
        url: `/project/${ref}/issues?category=performance`,
        items: [],
        shortcutId: SHORTCUT_IDS.NAV_ADVISORS_PERFORMANCE,
      },
      {
        name: 'Health issues',
        key: 'health',
        url: `/project/${ref}/issues?category=health`,
        items: [],
        shortcutId: SHORTCUT_IDS.NAV_ADVISORS_HEALTH,
      },
      {
        name: 'Query performance',
        key: 'query-performance',
        url: `/project/${ref}/observability/query-performance`,
        items: [],
        rightIcon: <ArrowUpRightIcon size={14} strokeWidth={1.5} className="h-4 w-4" />,
      },
    ],
  },
  ...(isPlatform && isAdvisorRulesEnabled
    ? [
        {
          title: 'Configuration',
          items: [
            {
              name: 'Check settings',
              key: 'rules',
              url: `/project/${ref}/advisors/rules/security`,
              items: [],
              shortcutId: SHORTCUT_IDS.NAV_ADVISORS_RULES,
            },
          ],
        },
      ]
    : []),
]

export const useGenerateIssuesMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return generateIssuesMenu({ ref, isAdvisorRulesEnabled, isPlatform: IS_PLATFORM })
}
