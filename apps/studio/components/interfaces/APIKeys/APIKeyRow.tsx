import { useMemo, useState } from 'react'
import { Eye, EyeOff, MoreVertical, TrashIcon, Logs, Settings2 } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { TooltipContent } from '@radix-ui/react-tooltip'
import CopyButton from 'components/ui/CopyButton'
import Table from 'components/to-be-cleaned/Table'

import DeleteAPIKeyModal from './DeleteAPIKeyModal'

import { APIKeysData } from 'data/api-keys/api-keys-query'

export interface APIKeyRowProps {
  projectRef: string
  apiKey: APIKeysData[0]
}

const APIKeyRow = ({ projectRef, apiKey }: APIKeyRowProps) => {
  const isSecret = apiKey.type === 'secret'
  const [shown, setShown] = useState(!isSecret)
  const [deleteVisible, setDeleteVisible] = useState(false)

  const hiddenKey = useMemo(
    () =>
      apiKey.prefix +
      Array.from({ length: apiKey.api_key.length - apiKey.prefix!.length }, () => '•').join(''),
    [apiKey.api_key, apiKey.prefix]
  )

  const canDeleteAPIKeys = true // todo

  return (
    <Table.tr>
      <Table.td>
        <DeleteAPIKeyModal
          visible={deleteVisible}
          setVisible={setDeleteVisible}
          projectRef={projectRef}
          apiKey={apiKey}
        />

        <div className="flex flex-row gap-2">
          <code>{shown ? apiKey.api_key : hiddenKey}</code>

          {isSecret ? (
            <Button
              type="outline"
              variant="icon"
              icon={shown ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
              onClick={() => {
                setShown((shown) => {
                  if (!shown) {
                    setTimeout(() => {
                      setShown(false)
                    }, 2000)
                  }

                  return !shown
                })
              }}
            />
          ) : null}

          <CopyButton text={apiKey.api_key} iconOnly />
        </div>
      </Table.td>

      {isSecret ? (
        <Table.td>
          <code>{apiKey.secret_jwt_template?.role ?? ''}</code>
        </Table.td>
      ) : null}

      <Table.td>{apiKey.description || '/'}</Table.td>

      <Table.td>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-2 focus-visible:outline-none">
            <MoreVertical size="14" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-80" align="end">
            <DropdownMenuItem className="flex gap-1.5 !pointer-events-auto">
              <Logs size="14" />
              View logs from this API key
            </DropdownMenuItem>
            <DropdownMenuItem className="flex gap-1.5 !pointer-events-auto">
              <Settings2 size="14" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  className="flex gap-1.5 !pointer-events-auto"
                  onClick={(e) => {
                    if (canDeleteAPIKeys) {
                      e.preventDefault()
                    }

                    setDeleteVisible(true)
                  }}
                >
                  <TrashIcon size="14" />
                  Delete API key
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canDeleteAPIKeys && (
                <TooltipContent side="left">
                  You need additional permissions to delete API keys
                </TooltipContent>
              )}
            </Tooltip_Shadcn_>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}

export default APIKeyRow
