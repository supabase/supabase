import dayjs from 'dayjs'
import { Check, Clipboard } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common/hooks'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import type { EdgeFunctionsResponse } from 'data/edge-functions/edge-functions-query'
import { copyToClipboard, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface EdgeFunctionsListItemProps {
  function: EdgeFunctionsResponse
}

export const EdgeFunctionsListItem = ({ function: item }: EdgeFunctionsListItemProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const [isCopied, setIsCopied] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef: ref })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint ?? ''
  const functionUrl =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain.hostname}/functions/v1/${item.slug}`
      : `${protocol}://${endpoint}/functions/v1/${item.slug}`

  return (
    <TableRow
      key={item.id}
      onClick={() => {
        router.push(`/project/${ref}/functions/${item.slug}`)
      }}
      className="cursor-pointer"
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <p className="text-sm text-foreground">{item.name}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-xs text-foreground-light flex gap-2 items-center truncate">
          <p title={functionUrl} className="font-mono truncate hidden md:inline max-w-[30rem]">
            {functionUrl}
          </p>
          <button
            type="button"
            className="text-foreground-lighter hover:text-foreground transition"
            onClick={(event: any) => {
              function onCopy(value: any) {
                setIsCopied(true)
                copyToClipboard(value)
                setTimeout(() => setIsCopied(false), 3000)
              }
              event.stopPropagation()
              onCopy(functionUrl)
            }}
          >
            {isCopied ? (
              <div className="text-brand">
                <Check size={14} strokeWidth={3} />
              </div>
            ) : (
              <div className="relative">
                <div className="block">
                  <Clipboard size={14} strokeWidth={1.5} />
                </div>
              </div>
            )}
          </button>
        </div>
      </TableCell>
      <TableCell className="hidden 2xl:table-cell">
        <p className="text-foreground-light">
          {dayjs(item.created_at).format('DD MMM, YYYY HH:mm')}
        </p>
      </TableCell>
      <TableCell className="lg:table-cell">
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-foreground-light">{dayjs(item.updated_at).fromNow()}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Last updated on {dayjs(item.updated_at).format('DD MMM, YYYY HH:mm')}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="lg:table-cell">
        <p className="text-foreground-light">{item.version}</p>
      </TableCell>
    </TableRow>
  )
}
