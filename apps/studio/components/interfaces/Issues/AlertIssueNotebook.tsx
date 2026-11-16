import { NotebookPenIcon } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { buildAlertIssueNotebookCells, renderAlertIssueNotebook } from './AlertIssueNotebook.utils'
import { AlertIssueQueryCell } from './AlertIssueQueryCell'
import { useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { BASE_PATH } from '@/lib/constants'

type AlertIssueNotebookProps = {
  issue: AlertIssue
  projectRef: string
}

export const AlertIssueNotebook = ({ issue, projectRef }: AlertIssueNotebookProps) => {
  const { createNotebook } = useCreateNotebook()
  const cells = renderAlertIssueNotebook(issue)

  if (cells.length === 0) return null

  const handleOpenAsNotebook = () => {
    const alertIssueUrl = `${window.location.origin}${BASE_PATH}/project/${projectRef}/issues/alerts/${issue.alert_issue_id}`
    createNotebook({
      name: issue.title,
      cells: buildAlertIssueNotebookCells(issue, alertIssueUrl),
    })
  }

  return (
    <section aria-label="Investigate" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm text-foreground">Investigate</h2>
        <Button
          variant="default"
          size="tiny"
          icon={<NotebookPenIcon size={14} />}
          onClick={handleOpenAsNotebook}
        >
          Open as notebook
        </Button>
      </div>
      {cells.map((cell, index) => {
        const key = `${issue.alert_issue_id}-${index}`
        if (cell.status === 'ready') {
          return (
            <div key={key} className="h-96">
              <AlertIssueQueryCell id={key} cell={cell} />
            </div>
          )
        }
        return (
          <Admonition
            key={key}
            type="warning"
            title={`${cell.title} can't run`}
            description={cell.reason}
          />
        )
      })}
    </section>
  )
}
