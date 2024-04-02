import { Eye, EyeIcon, EyeOff, HelpCircle, Table2 } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import { LINT_TYPES, Lint } from 'data/lint/lint-query'
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
import { Markdown } from '../Markdown'
import { LintCTA, getHumanReadableTitle } from './ReportLints.utils'

type ReportLintsTableRowProps = {
  lint: Lint
}

const ReportLintsTableRow = ({ lint }: ReportLintsTableRowProps) => {
  const { ref } = useParams()
  const [selectedLint, setSelectedLint] = useState<Lint | null>(null)

  const [lintIgnoreList, setLintIgnoreList] = useLocalStorageQuery<string[]>(
    LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST,
    []
  )
  const isIgnored = lintIgnoreList.includes(lint.cache_key)

  // if the lint type can't be handled (there's no CTA text defined), don't render it
  if (!LINT_TYPES.includes(lint.name)) {
    return null
  }

  const toggleLintIgnore = () => {
    let currentIgnoreList = []
    const cacheKey = lint.cache_key

    // Check if the cacheKey exists in the array and ignore or unignore it
    const index = lintIgnoreList.indexOf(cacheKey)
    if (index !== -1) {
      currentIgnoreList = lintIgnoreList.filter((l) => l !== cacheKey)
    } else {
      currentIgnoreList = lintIgnoreList.concat(cacheKey)
    }
    setLintIgnoreList(currentIgnoreList)
    setSelectedLint(null)
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

        <Table.td className="flex flex-col gap-y-2">
          <div>
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

            {(lint.metadata?.type === 'table' || lint.metadata?.type === 'view') && (
              <div className="flex items-center gap-x-4 text-xs py-1">
                {lint.metadata?.schema && (
                  <div className="flex items-center gap-x-1">
                    <p className="text-foreground-lighter">schema</p>
                    <p className="text-foreground font-mono">{lint.metadata?.schema}</p>
                  </div>
                )}
                <div className="flex items-center gap-x-1">
                  {lint.metadata?.type === 'table' && (
                    <Table2 size={15} strokeWidth={1.5} className="text-foreground-lighter" />
                  )}
                  {lint.metadata?.type === 'view' && (
                    <Eye size={15} strokeWidth={1.5} className="text-foreground-lighter" />
                  )}
                  <p className="text-foreground font-mono">{lint.metadata?.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-y-1">
            {lint.detail && (
              <Markdown
                className="text-foreground-light max-w-full leading-relaxed"
                content={lint.detail}
              />
            )}
            {lint.remediation && (
              <p className="text-foreground-light max-w-full leading-relaxed">
                You can read more about this lint rule and the best ways to remedy it{' '}
                <a
                  className="underline text-foreground-light transition-all hover:text-foreground hover:decoration-brand"
                  href={lint.remediation}
                  target="_blank"
                  rel="noreferrer"
                >
                  here
                </a>
              </p>
            )}
          </div>
        </Table.td>
        <Table.td>
          <div className="flex items-center justify-end gap-x-2">
            <LintCTA title={lint.name} projectRef={ref!} metadata={lint.metadata} />
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="text"
                  size="small"
                  className="px-1"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedLint(lint)
                  }}
                  icon={isIgnored ? <EyeIcon strokeWidth={1} /> : <EyeOff strokeWidth={1} />}
                />
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="bottom">
                {isIgnored ? 'Unignore problem' : 'Ignore problem'}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          </div>
        </Table.td>
      </Table.tr>
      <Modal
        size="small"
        alignFooter="right"
        visible={selectedLint !== null}
        onCancel={() => setSelectedLint(null)}
        onConfirm={() => toggleLintIgnore()}
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
