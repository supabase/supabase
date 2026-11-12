import type { Project } from '@supabase/mcp-server-supabase/apps'
import { MoreHorizontalIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import { ExplorerToolbarAction } from '../explorer/explorer-toolbar'
import { checkIcons, projectChecks, type ProjectCheckId } from './project-overview'

/** The project home's checks, sent from a list row without opening the project. */
export function ProjectChecksMenu({
  project,
  isBusy,
  onRun,
}: {
  project: Project
  isBusy: boolean
  /** Omit when the host cannot send to chat; the checks show as unavailable. */
  onRun?: (check: ProjectCheckId) => void
}) {
  const canRun = !!onRun && !isBusy
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ExplorerToolbarAction
          // Sits above the row's stretched open button.
          className="relative z-10"
          aria-label={`More actions for ${project.name}`}
          tooltip="More actions"
          icon={<MoreHorizontalIcon size={16} strokeWidth={2} />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {projectChecks.map((check) => {
          const Icon = checkIcons[check.id]
          return (
            <DropdownMenuItem
              key={check.id}
              disabled={!canRun}
              className="items-start gap-2"
              onSelect={() => onRun?.(check.id)}
            >
              <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="flex flex-col">
                <span className="text-foreground">{check.title}</span>
                <span className="text-xs text-foreground-lighter">{check.description}</span>
              </span>
            </DropdownMenuItem>
          )
        })}
        {!onRun && (
          <p className="px-2 py-1.5 text-xs text-foreground-lighter">
            This host doesn’t support sending prompts to chat.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
