import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useParams } from 'common'
import { MoreHorizontalIcon, PlusIcon, RotateCcwIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { CreateIssueDialog } from '@/components/interfaces/Issues/CreateIssueDialog'
import { SidebarBreadcrumb } from '@/components/layouts/Navigation/SidebarBreadcrumb'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { Shortcut } from '@/components/ui/Shortcut'
import { issuesKeys } from '@/data/issues/keys'
import { resetIssuesMock } from '@/data/issues/mock/issues-mock-api'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const IssuesSidebarHeader = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Prototype only: the Issues API is mocked in the browser, so this restores its seed data
  const handleResetDemoData = async () => {
    if (!ref) return
    resetIssuesMock(ref)
    await queryClient.invalidateQueries({ queryKey: issuesKeys.all(ref) })
    toast.success('Demo issues restored')
  }

  return (
    <>
      <SidebarBreadcrumb
        aria-label="Issues navigation"
        label="Issues"
        action={
          <div className="flex items-center gap-1">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  size="tiny"
                  aria-label="Issue list options"
                  className="size-7 px-0"
                  icon={<MoreHorizontalIcon />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-x-2" onSelect={handleResetDemoData}>
                  <RotateCcwIcon size={14} />
                  <span>Reset demo data</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ButtonTooltip
              asChild
              variant="text"
              size="tiny"
              className="size-7 shrink-0 px-0"
              icon={<SettingsIcon />}
              tooltip={{ content: { side: 'bottom', text: 'Issue settings' } }}
            >
              <Link
                to="/project/$ref/issues/settings"
                params={{ ref: ref ?? '' }}
                aria-label="Issue settings"
              />
            </ButtonTooltip>
            <Shortcut
              id={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
              label="New issue"
              side="bottom"
              onTrigger={() => setIsCreateOpen(true)}
            >
              <Button
                size="tiny"
                variant="outline"
                aria-label="New issue"
                className="size-7 shrink-0 px-0"
                icon={<PlusIcon />}
                onClick={() => setIsCreateOpen(true)}
              />
            </Shortcut>
          </div>
        }
      />
      <CreateIssueDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  )
}
