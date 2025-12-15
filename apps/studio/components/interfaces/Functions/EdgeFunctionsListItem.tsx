import dayjs from 'dayjs'
import { Check, Copy } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { BASE_PATH } from 'lib/constants'
import { useParams } from 'common/hooks'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import type { EdgeFunctionsResponse } from 'data/edge-functions/edge-functions-query'
import { copyToClipboard, TableCell, TableRow } from 'ui'
import { TimestampInfo } from 'ui-patterns'

const MIDDLE_MOUSE_BUTTON = 1

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

  const handleNavigation = (event: React.MouseEvent | React.KeyboardEvent) => {
    const url = `/project/${ref}/functions/${item.slug}`

    const isModifierClick =
      'button' in event && event.button === 0 && (event.metaKey || event.ctrlKey)
    if (window && isModifierClick) {
      event.preventDefault()
      window.open(`${BASE_PATH}${url}`, '_blank')
      return
    }

    const isMiddleClick = 'button' in event && event.button === MIDDLE_MOUSE_BUTTON
    if (window && isMiddleClick) {
      event.preventDefault()
      window.open(`${BASE_PATH}${url}`, '_blank')
      return
    }

    router.push(url)
  }

  return (
    <TableRow
      key={item.id}
      onClick={handleNavigation}
      onAuxClick={handleNavigation}
      onKeyDown={handleNavigation}
      tabIndex={0}
      className="cursor-pointer"
    >
      <TableCell>
        <p className="text-sm text-foreground whitespace-nowrap py-2">{item.name}</p>
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
                  <Copy size={14} strokeWidth={1.5} />
                </div>
              </div>
            )}
          </button>
        </div>
      </TableCell>
      <TableCell className="hidden 2xl:table-cell whitespace-nowrap">
        <p className="text-foreground-light">
          {dayjs(item.created_at).format('DD MMM, YYYY HH:mm')}
        </p>
      </TableCell>
      <TableCell className="lg:table-cell">
        <TimestampInfo
          className="text-sm text-foreground-light whitespace-nowrap"
          utcTimestamp={item.updated_at}
          label={dayjs(item.updated_at).fromNow()}
        />
      </TableCell>
      <TableCell className="lg:table-cell">
        <p className="text-foreground-light">{item.version}</p>
      </TableCell>
    </TableRow>
  )
}
