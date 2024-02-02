import { useParams } from 'common'
import { TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import CopyButton from 'components/ui/CopyButton'
import { SqlSnippet } from 'data/content/sql-snippets-query'
import TreeView, { flattenTree } from 'react-accessible-treeview'
import clsx from 'clsx'
import Link from 'next/link'

interface FileDirectory {
  snippets: SqlSnippet[]
}

export const FileDirectory = ({ snippets }: FileDirectory) => {
  const { ref, id: activeId } = useParams()

  const directory = {
    name: '',
    children: snippets.map((x) => ({ id: x.id, name: x.name, description: x.description })),
  }
  const data = flattenTree(directory)

  return (
    <div className="ide">
      <TreeView
        multiSelect
        togglableSelect
        clickAction="EXCLUSIVE_SELECT"
        data={data}
        nodeRenderer={({ element, getNodeProps }) => {
          const isActive = element.id === activeId
          const snippet = snippets.find((x) => x.id === element.id)
          const hideTooltip = isActive || snippet?.content === undefined
          if (snippet === undefined) return null

          return (
            <Tooltip_Shadcn_ delayDuration={100}>
              <TooltipTrigger_Shadcn_ asChild>
                <div
                  {...getNodeProps()}
                  className={clsx(
                    'cursor-pointer transition text-sm px-5 h-7 flex items-center',
                    isActive
                      ? 'text-foreground bg-surface-300'
                      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground/80'
                  )}
                >
                  <Link
                    title={snippet.description || snippet.name}
                    href={`/project/${ref}/sql/${snippet.id}`}
                    className={clsx(
                      'w-full overflow-hidden truncate',
                      isActive
                        ? 'text-foreground'
                        : 'text-foreground-light group-hover:text-foreground/80',
                      'text-sm transition-all overflow-hidden text-ellipsis'
                    )}
                  >
                    {element.name}
                  </Link>
                </div>
              </TooltipTrigger_Shadcn_>
              {!hideTooltip && (
                <TooltipContent_Shadcn_
                  side="right"
                  align="start"
                  className="w-96 flex flex-col gap-y-2 py-3"
                >
                  <p className="text-xs">Query preview:</p>
                  <div className="bg-surface-300 py-2 px-3 rounded relative">
                    {snippet.content.sql.trim() ? (
                      <SimpleCodeBlock
                        showCopy={false}
                        className="sql"
                        parentClassName="!p-0 [&>div>span]:text-xs [&>div>span]:tracking-tighter"
                      >
                        {snippet.content.sql
                          .replaceAll('\n', ' ')
                          .replaceAll(/\s+/g, ' ')
                          .slice(0, 43) + `${snippet.content.sql.length > 43 ? '...' : ''}`}
                      </SimpleCodeBlock>
                    ) : (
                      <p className="text-xs text-foreground-lighter">This query is empty</p>
                    )}
                    {snippet.content.sql.trim() && (
                      <CopyButton
                        iconOnly
                        type="default"
                        className="px-1 absolute top-1.5 right-1.5"
                        text={snippet.content.sql}
                      />
                    )}
                  </div>
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          )
        }}
      />
    </div>
  )
}
