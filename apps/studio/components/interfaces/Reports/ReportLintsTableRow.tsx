import Table from 'components/to-be-cleaned/Table'
import { useLocalStorageQuery } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { EyeOff, Maximize2, MoreHorizontal, MoreVertical } from 'lucide-react'
import { Lint } from 'pages/project/[ref]/reports/lints'
import { getHumanReadableTitle } from 'pages/project/[ref]/reports/lints.utils'
import { useState } from 'react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Modal,
  cn,
} from 'ui'

type ReportLintsTableRowProps = {
  lint: Lint
}

const ReportLintsTableRow = ({ lint }: ReportLintsTableRowProps) => {
  const [expanded, setExpanded] = useState(false)
  const [seletectdLint, setSelectedLint] = useState<Lint | null>(null)
  const [lintAction, setLintAction] = useState<'ignore' | 'unignore'>('ignore')

  const [lintIgnoreList, setLintIgnoreList] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.PROJECT_LINT_IGNORE_LIST,
    ''
  )
  const selectedLintIsIgnored = lintIgnoreList.split(',').includes(lint.cache_key)

  function toggleLintIgnore(lint: Lint) {
    const currentIgnoreList = lintIgnoreList ? lintIgnoreList.split(',') : [] // Split only if lintIgnoreList is not empty
    const cacheKey = lint.cache_key

    // Check if the cacheKey exists in the array
    const index = currentIgnoreList.indexOf(cacheKey)
    if (index !== -1) {
      // If lint is ignored, unignore it
      currentIgnoreList.splice(index, 1) // Remove the cacheKey from the array
    } else {
      // If lint is not ignored, ignore it
      currentIgnoreList.push(cacheKey)
    }

    const ignoreString = currentIgnoreList.join(',')
    console.log({ ignoreString })
    setLintIgnoreList(ignoreString) // Store the updated string back to localStorage
  }

  return (
    <>
      <Table.tr>
        <Table.td className=" w-20">
          <Badge
            className="!rounded w-16 font-mono text-center justify-center"
            color={
              lint.level === 'INFO'
                ? 'scale'
                : lint.level === 'WARN'
                  ? 'amber'
                  : lint.level === 'ERROR'
                    ? 'red'
                    : 'yellow'
            }
          >
            {lint.level}
          </Badge>
        </Table.td>
        <Table.td className="truncate w-48">{getHumanReadableTitle(lint.name)}</Table.td>
        <Table.td className="">{lint.description}</Table.td>
        <Table.td className="w-16 text-right">
          <div className="flex items-center gap-4 text-right ml-auto">
            {lint.remediation && (
              <Button type="text" onClick={() => setExpanded(!expanded)}>
                <Maximize2 size={14} />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" className="px-1 ml-auto">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" className="w-[150px]">
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedLint(lint)
                  }}
                >
                  <EyeOff size={16} strokeWidth={1} />
                  <p>
                    {lintIgnoreList.split(',').includes(lint.cache_key) ? 'Unignore' : 'Ignore'}{' '}
                    this lint
                  </p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Table.td>
      </Table.tr>
      {expanded && (
        <Table.tr
          className={cn(
            {
              'h-0 opacity-0': !expanded,
              'h-auto opacity-100': expanded,
            },
            'transition-all'
          )}
        >
          <Table.td colSpan={4}>
            <p className="text-foreground">Remediation suggestions</p>
            <div className="mt-1 text-foreground-lighter text-sm max-w-3xl">{lint.remediation}</div>
          </Table.td>
        </Table.tr>
      )}
      <Modal
        size="small"
        alignFooter="right"
        visible={seletectdLint !== null}
        onCancel={() => setSelectedLint(null)}
        onConfirm={() => toggleLintIgnore(lint)}
        header={<h3>Confirm to {selectedLintIsIgnored ? 'unignore' : 'ignore'} this lint</h3>}
      >
        <div className="py-4">
          <Modal.Content>
            <p className="text-sm">
              {selectedLintIsIgnored
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
