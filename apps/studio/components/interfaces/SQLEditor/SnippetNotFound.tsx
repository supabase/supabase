import { Link } from '@tanstack/react-router'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useEditorType } from '@/components/layouts/editors/EditorsLayout.hooks'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useTabsStateSnapshot } from '@/state/tabs'

interface SnippetNotFoundProps {
  id?: string
  projectRef: string
  tabId?: string
}

export const SnippetNotFound = ({ id, projectRef, tabId }: SnippetNotFoundProps) => {
  // `tabs.handleTabClose` still takes a Next-shaped router
  const router = useRouter()
  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const { setLastVisitedSnippet } = useDashboardHistory()

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[400px]">
        <Admonition
          type="default"
          title={`Unable to find snippet with ID ${id}`}
          description="This snippet doesn't exist in your project"
        >
          {!!tabId ? (
            <Button
              className="mt-2"
              onClick={() => {
                tabs.handleTabClose({
                  id: tabId,
                  router,
                  editor,
                  onClearDashboardHistory: () => setLastVisitedSnippet(undefined),
                })
              }}
            >
              Close tab
            </Button>
          ) : (
            <Button asChild className="mt-2" onClick={() => setLastVisitedSnippet(undefined)}>
              <Link to="/project/$ref/sql" params={{ ref: projectRef }}>
                Head back
              </Link>
            </Button>
          )}
        </Admonition>
      </div>
    </div>
  )
}
