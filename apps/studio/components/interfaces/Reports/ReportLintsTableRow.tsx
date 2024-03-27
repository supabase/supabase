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
import { useParams } from 'common'
import Link from 'next/link'

type ReportLintsTableRowProps = {
  lint: Lint
}

const ReportLintsTableRow = ({ lint }: ReportLintsTableRowProps) => {
  const { ref } = useParams()
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

  const ctaUrl =
    lint.name === 'unused_index'
      ? `/project/${ref}/database/indexes?schema=${lint.metadata?.schema}&table=${lint.metadata?.name}`
      : lint.name === 'no_primary_key'
        ? `/project/${ref}/editor`
        : lint.name === 'auth_users_exposed'
          ? `/project/${ref}/editor`
          : lint.name === 'multiple_permissive_policies'
            ? `/project/${ref}/auth/policies?schema=${lint.metadata?.schema}&search=${lint.metadata?.name}`
            : lint.name === 'unindexed_foreign_keys'
              ? `/project/${ref}/database/indexes?schema=${lint.metadata?.schema}`
              : lint.name === 'auth_rls_initplan'
                ? `/project/${ref}/auth/policies`
                : '/'

  const ctaText =
    lint.name === 'unused_index'
      ? 'View index'
      : lint.name === 'no_primary_key'
        ? 'View table'
        : lint.name === 'auth_users_exposed'
          ? 'View table'
          : lint.name === 'multiple_permissive_policies' || lint.name === 'auth_rls_initplan'
            ? 'View policies'
            : lint.name === 'unindexed_foreign_keys'
              ? 'Create an index'
              : undefined

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
              <Markdown
                className="text-foreground-light max-w-full leading-relaxed"
                content={lint.remediation}
              />
            )}
          </div>
        </Table.td>
        <Table.td>
          <div className="flex items-center justify-end gap-x-2">
            {ctaText !== undefined && (
              <Button asChild type="default">
                <Link href={ctaUrl} target="_blank" rel="noreferrer">
                  {ctaText}
                </Link>
              </Button>
            )}
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="text"
                  className="px-1"
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
          </div>
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
