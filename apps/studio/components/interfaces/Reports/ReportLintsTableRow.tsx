import { Eye, EyeIcon, EyeOff, HelpCircle, Table2 } from 'lucide-react'
import { useState } from 'react'

import Table from 'components/to-be-cleaned/Table'
import { Lint } from 'data/lint/lint-query'
import { useLocalStorageQuery } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import {
  Badge,
  Button,
  Modal,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { getHumanReadableTitle } from './ReportLints.utils'
import { Markdown } from '../Markdown'

type ReportLintsTableRowProps = {
  lint: Lint
}

const ReportLintsTableRow = ({ lint }: ReportLintsTableRowProps) => {
  const [seletectdLint, setSelectedLint] = useState<Lint | null>(null)

  const [lintIgnoreList, setLintIgnoreList] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST,
    ''
  )
  const isIgnored = lintIgnoreList.split(',').includes(lint.cache_key)

  function toggleLintIgnore(lint: Lint) {
    const currentIgnoreList = lintIgnoreList ? lintIgnoreList.split(',') : []
    const cacheKey = lint.cache_key

    // Check if the cacheKey exists in the array and ignore or unignore it
    const index = currentIgnoreList.indexOf(cacheKey)
    if (index !== -1) {
      currentIgnoreList.splice(index, 1)
    } else {
      currentIgnoreList.push(cacheKey)
    }
    const ignoreString = currentIgnoreList.join(',')
    setLintIgnoreList(ignoreString)
  }

  return (
    <>
      <Table.tr>
        <Table.td className="w-20 align-top">
          <Badge
            className="!rounded w-16 font-mono text-center justify-center"
            variant={
              lint.level === 'ERROR' ? 'destructive' : lint.level === 'WARN' ? 'warning' : 'default'
            }
          >
            {lint.level}
          </Badge>
        </Table.td>
        <Table.td className="flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2">
            <p className="text-foreground">{getHumanReadableTitle(lint.name)}</p>

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <HelpCircle size={14} />
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="bottom" className="w-72">
                {lint.description}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          </div>
          <div className="grid gap-3">
            {lint.detail && (
              <Markdown className="text-foreground-light max-w-full" content={lint.detail} />
            )}
            {lint.remediation && <p>{lint.remediation}</p>}

            <div>
              {(lint.metadata?.table || lint.metadata?.view_name) && (
                <div className="flex items-center gap-2 text-xs">
                  {lint.metadata?.table && (
                    <Table2 size={15} strokeWidth={1.5} className="text-foreground-lighter" />
                  )}
                  {lint.metadata?.view_name && (
                    <Eye size={15} strokeWidth={1.5} className="text-foreground-lighter" />
                  )}
                  <span className="font-mono">
                    {lint.metadata?.table || lint.metadata?.view_name}
                  </span>
                  {lint.metadata?.schema && (
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-foreground-lighter">schema</span>
                      <span className="text-foreground font-mono">{lint.metadata?.schema}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Table.td>
        <Table.td className="w-16 text-right">
          <Tooltip_Shadcn_>
            <TooltipTrigger_Shadcn_ asChild>
              <Button
                type="text"
                className="px-1 ml-auto"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedLint(lint)
                }}
              >
                {isIgnored ? (
                  <EyeIcon size={16} strokeWidth={1} />
                ) : (
                  <EyeOff size={16} strokeWidth={1} />
                )}
              </Button>
            </TooltipTrigger_Shadcn_>
            <TooltipContent_Shadcn_ side="bottom">
              {isIgnored ? 'Unignore problem' : 'Ignore problem'}
            </TooltipContent_Shadcn_>
          </Tooltip_Shadcn_>
        </Table.td>
      </Table.tr>
      <Modal
        size="small"
        alignFooter="right"
        visible={seletectdLint !== null}
        onCancel={() => setSelectedLint(null)}
        onConfirm={() => toggleLintIgnore(lint)}
        header={<h3>Confirm to {isIgnored ? 'unignore' : 'ignore'} this lint</h3>}
      >
        <div className="py-4">
          <Modal.Content>
            <p className="text-sm">
              {isIgnored
                ? 'Unignoring this lint will remove it from the Ignored Issues list. It will move it back to the main list above.'
                : 'Ignoring this lint will remove it from the main list. It will still be visible in the Ignored Issues list below.'}
            </p>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default ReportLintsTableRow
