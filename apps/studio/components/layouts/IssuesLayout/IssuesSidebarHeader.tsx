import { useParams } from 'common'
import { RefreshCwIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import { useIsAdvisorRulesEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { SidebarBreadcrumb } from '@/components/layouts/Navigation/SidebarBreadcrumb'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { Shortcut } from '@/components/ui/Shortcut'
import { useProjectIssues } from '@/data/issues/useProjectIssues'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const IssuesSidebarHeader = () => {
  const { ref } = useParams()
  const isAdvisorRulesEnabled = useIsAdvisorRulesEnabled()
  const { isFetching, refetch } = useProjectIssues({ projectRef: ref })

  const canOpenSettings = IS_PLATFORM && isAdvisorRulesEnabled

  return (
    <SidebarBreadcrumb
      aria-label="Issues navigation"
      label="Issues"
      action={
        <div className="flex items-center gap-1">
          <Shortcut
            id={SHORTCUT_IDS.ADVISORS_REFRESH}
            label="Rerun checks"
            side="bottom"
            options={{ enabled: !isFetching }}
            onTrigger={refetch}
          >
            <Button
              variant="text"
              size="tiny"
              aria-label="Rerun checks"
              className="size-7 shrink-0 px-0"
              icon={<RefreshCwIcon />}
              loading={isFetching}
              disabled={isFetching}
              onClick={() => refetch()}
            />
          </Shortcut>
          {canOpenSettings && (
            <ButtonTooltip
              asChild
              variant="text"
              size="tiny"
              className="size-7 shrink-0 px-0"
              icon={<SettingsIcon />}
              tooltip={{ content: { side: 'bottom', text: 'Check settings' } }}
            >
              <Link href={`/project/${ref}/advisors/rules/security`} aria-label="Check settings" />
            </ButtonTooltip>
          )}
        </div>
      }
    />
  )
}
