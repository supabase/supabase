import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from 'components/interfaces/DataTableDemo/components/custom/table'
import { useCopyToClipboard } from 'components/interfaces/DataTableDemo/hooks/use-copy-to-clipboard'
import { Check, Copy } from 'lucide-react'

interface KVTableProps {
  data: Record<string, string | number | boolean>
}
export function KVTable({ data }: KVTableProps) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <Table>
          <TableBody>
            {Object.entries(data).map(([key, value]) => {
              return <RowAction key={key} label={key} value={value} />
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RowAction({ label, value }: { label: string; value: string | number | boolean }) {
  const { copy, isCopied } = useCopyToClipboard()

  return (
    <TableRow
      className="group text-left *:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
      onClick={(e) => {
        e.stopPropagation()
        copy(value.toString())
      }}
    >
      <TableCell className="bg-muted/50 py-1 font-mono font-medium">{label}</TableCell>
      <TableCell className="relative py-1 font-mono">
        {value}
        <div className="invisible absolute right-1.5 top-1.5 rounded-sm border border-border bg-background p-0.5 backdrop-blur-sm group-hover:visible">
          {!isCopied ? <Copy className="h-3 w-3" /> : <Check className="h-3 w-3" />}
        </div>
      </TableCell>
    </TableRow>
  )
}
