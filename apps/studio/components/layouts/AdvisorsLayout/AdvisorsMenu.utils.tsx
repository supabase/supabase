import { useParams } from 'common'
import { ArrowUpRight } from 'lucide-react'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const useGenerateAdvisorsMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()

  return [
    {
      title: 'Advisors',
      items: [
        {
          name: 'Security Advisor',
          key: 'security',
          url: `/project/${ref}/advisors/security`,
          items: [],
          shortcutId: SHORTCUT_IDS.NAV_ADVISORS_SECURITY,
        },
        {
          name: 'Performance Advisor',
          key: 'performance',
          url: `/project/${ref}/advisors/performance`,
          items: [],
          shortcutId: SHORTCUT_IDS.NAV_ADVISORS_PERFORMANCE,
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance`,
          items: [],
          rightIcon: <ArrowUpRight size={14} strokeWidth={1.5} className="h-4 w-4" />,
        },
      ],
    },
    ...(IS_PLATFORM && isAdvisorRulesEnabled
      ? [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Settings',
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
}
