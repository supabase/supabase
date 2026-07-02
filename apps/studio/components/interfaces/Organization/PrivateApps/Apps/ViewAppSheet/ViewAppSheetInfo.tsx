import { formatDistanceToNow } from 'date-fns'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Card,
  CardContent,
  copyToClipboard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import type { Installation, PrivateApp } from '../../PrivateAppsContext'

interface ViewAppSheetInfoProps {
  app: PrivateApp
  isInstalled: boolean
  installation: Installation | undefined
}

function CopyableId({ id, label }: { id: string; label: string }) {
  const [isCopied, setIsCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    copyToClipboard(id, () => {
      setIsCopied(true)
      toast.success(`Copied ${label} to clipboard`)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-x-1 cursor-pointer border border-transparent border-dashed rounded-sm transition-colors hover:bg-surface-100 hover:border hover:border-strong group font-mono text-xs text-foreground-light px-1 -ml-1"
    >
      <span className="truncate">{id}</span>
      {isCopied ? (
        <Check size={12} strokeWidth={1.25} className="text-brand shrink-0" />
      ) : (
        <Copy
          size={12}
          strokeWidth={1.25}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        />
      )}
    </button>
  )
}

export function ViewAppSheetInfo({ app, isInstalled, installation }: ViewAppSheetInfoProps) {
  return (
    <div className="px-5 sm:px-6 py-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Metadata</h3>
      <Card className="w-full overflow-hidden bg-surface-100">
        <CardContent className="p-0">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[40%]">
                  Field
                </TableHead>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                  Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Name</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium truncate">{app.name}</p>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Created</p>
                </TableCell>
                <TableCell>
                  <p className="truncate">
                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </p>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Status</p>
                </TableCell>
                <TableCell>
                  {isInstalled ? (
                    <Badge variant="success" className="uppercase">
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="default" className="uppercase">
                      Uninstalled
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">App ID</p>
                </TableCell>
                <TableCell>
                  <CopyableId id={app.id} label="App ID" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Installation ID</p>
                </TableCell>
                <TableCell>
                  {installation ? (
                    <CopyableId id={installation.id} label="Installation ID" />
                  ) : (
                    <p className="font-mono text-xs text-foreground-light">—</p>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
