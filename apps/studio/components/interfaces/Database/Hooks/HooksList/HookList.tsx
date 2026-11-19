import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { includes } from 'lodash'
import { EditIcon, MoreVerticalIcon, TrashIcon } from 'lucide-react'
import Image from 'next/legacy/image'
import { parseAsString, useQueryState } from 'nuqs'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { databaseHooksQueryOptions } from '@/data/database-triggers/database-triggers-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { isEdgeFunctionUrl } from '@/lib/api/edgeFunctions'
import { BASE_PATH } from '@/lib/constants'
import { useGrant } from '@/lib/grants'

export interface HookListProps {
  schema: string
  filterString: string
}

export const HookList = ({ schema, filterString }: HookListProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'read' }
  )
  const writeGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef: project?.ref },
    { variant: 'write' }
  )
  const { data: hooks } = useQuery(
    databaseHooksQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      grant: readGrant.grant,
    })
  )

  const [, setSelectedHookIdToEdit] = useQueryState('edit', parseAsString.withDefault(''))
  const [, setSelectedHookIdToDelete] = useQueryState('delete', parseAsString.withDefault(''))

  const restUrl = project?.restUrl

  const filteredHooks = (hooks ?? []).filter(
    (x) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase()) &&
      x.schema === schema &&
      x.function_args.length >= 2
  )
  const canUpdateWebhook = writeGrant.status === 'granted'

  return (
    <>
      {filteredHooks.map((x) => {
        const [url, method] = x.function_args
        const isEdgeFunction = isEdgeFunctionUrl(url, ref ?? '', restUrl)

        return (
          <Table.tr key={x.id}>
            <Table.td>
              <div className="flex items-center space-x-4">
                <div>
                  <Image
                    src={
                      isEdgeFunction
                        ? `${BASE_PATH}/img/function-providers/supabase-severless-function.png`
                        : `${BASE_PATH}/img/function-providers/http-request.png`
                    }
                    alt="hook-type"
                    layout="fixed"
                    width="20"
                    height="20"
                    title={isEdgeFunction ? 'Supabase Edge Function' : 'HTTP Request'}
                  />
                </div>
                <p title={x.name} className="truncate">
                  {x.name}
                </p>
              </div>
            </Table.td>
            <Table.td className="hidden space-x-2 lg:table-cell">
              <p title={x.table}>{x.table}</p>
            </Table.td>
            <Table.td className="hidden space-x-1 xl:table-cell">
              {x.events.map((event: string) => (
                <Badge key={event}>{event}</Badge>
              ))}
            </Table.td>
            <Table.td className="hidden xl:table-cell">
              <p className="truncate" title={url}>
                <code>{method}</code>: {url}
              </p>
            </Table.td>
            <Table.td className="text-right">
              <div className="flex justify-end gap-4">
                {canUpdateWebhook ? (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="w-6.5"
                            icon={<MoreVerticalIcon />}
                            aria-label={`${x.name} actions`}
                            // Tooltip repeats the label; screen readers would read it twice
                            aria-describedby={undefined}
                          />
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">More options</TooltipContent>
                    </Tooltip>

                    <DropdownMenuContent side="bottom" align="end" className="w-32">
                      <DropdownMenuItem
                        className="gap-x-2"
                        onClick={() => setSelectedHookIdToEdit(x.id.toString())}
                      >
                        <EditIcon size={14} />
                        <p>Edit hook</p>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-x-2"
                        onClick={() => setSelectedHookIdToDelete(x.id.toString())}
                      >
                        <TrashIcon size={14} />
                        <p>Delete hook</p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <ButtonTooltip
                    disabled
                    className="px-1"
                    icon={<MoreVerticalIcon />}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: 'You need additional permissions to update webhooks',
                      },
                    }}
                  />
                )}
              </div>
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}
