'use client'

import { Button } from '@/registry/default/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/default/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

export type RowAction = {
  label: string
  prompt: string
}

export type RowItem = {
  primaryText: string
  secondaryText?: string
  actions?: RowAction[]
}

export type RowProps = {
  rows: RowItem[]
  onActionSelect?: (prompt: string) => void
}

export function Row({ rows, onActionSelect }: RowProps) {
  if (!rows.length) return null

  return (
    <div className="space-y-[1px] w-full mb-4">
      {rows.map((row, index) => {
        const hasActions = Boolean(row.actions?.length)

        return (
          <div
            className="flex items-start justify-between gap-3 first:rounded-t-lg last:rounded-b-lg bg-card px-3 py-3 text-sm w-full"
            key={`${row.primaryText}-${index}`}
          >
            <div className="space-y-1">
              <p className="font-medium leading-none">{row.primaryText}</p>
              {row.secondaryText ? (
                <p className="text-muted-foreground text-xs">{row.secondaryText}</p>
              ) : null}
            </div>
            {hasActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="Open task actions"
                    className="h-8 w-8 text-muted-foreground"
                    size="icon"
                    variant="ghost"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {row.actions?.map((action) => (
                    <DropdownMenuItem
                      key={action.label}
                      className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault()
                        if (action.prompt) {
                          onActionSelect?.(action.prompt)
                        }
                      }}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
