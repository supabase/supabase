import saveAs from 'file-saver'
import { Download } from 'lucide-react'
import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useGetUnifiedLogsMutation } from 'data/logs/get-unified-logs'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { QuerySearchParamsType } from '../UnifiedLogs.types'

const DEFAULT_NUM_ROWS = '100'
const DEFAULT_DURATION = '1'

interface DownloadLogsButtonProps {
  searchParameters: QuerySearchParamsType
}

export const DownloadLogsButton = ({ searchParameters }: DownloadLogsButtonProps) => {
  const { ref } = useParams()
  const [numRows, setNumRows] = useState(DEFAULT_NUM_ROWS)
  const [numHours, setNumHours] = useState(DEFAULT_NUM_ROWS)
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>()

  const { mutate: retrieveLogs, isLoading } = useGetUnifiedLogsMutation({
    onSuccess: (res) => {
      if (selectedFormat === 'json') {
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'text/json;charset=utf-8;' })
        saveAs(blob, `supabase_logs.json`)
        toast.success('Downloading logs as JSON')
      } else {
        if (res.length === 0) return
        const headers = Object.keys(res[0])
        const formattedResults = res.map((row: any) => {
          const r = { ...row }
          Object.keys(row).forEach((x) => {
            if (typeof row[x] === 'object') r[x] = JSON.stringify(row[x])
          })
          return r
        })
        const csv = Papa.unparse(formattedResults, { columns: headers })
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, `supabase_logs.csv`)
        toast.success('Downloading logs as CSV')
      }

      setSelectedFormat(undefined)
    },
  })

  const onExportData = () => {
    if (!ref) return console.error('Project ref is required')

    const hasSpecificTimeRange = 'date' in searchParameters
    retrieveLogs({
      projectRef: ref,
      search: searchParameters,
      limit: Number(numRows),
      hoursAgo: !hasSpecificTimeRange ? Number(numHours) : undefined,
    })
  }

  useEffect(() => {
    if (!!selectedFormat) {
      setNumRows(DEFAULT_NUM_ROWS)
      setNumHours(DEFAULT_DURATION)
    }
  }, [selectedFormat])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <ButtonTooltip
            type="outline"
            className="w-[26px]"
            icon={<Download className="text-foreground" />}
            tooltip={{ content: { side: 'bottom', text: 'Download logs' } }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setSelectedFormat('csv')}>
            <p>Download as CSV</p>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSelectedFormat('json')}>
            <p>Download as JSON</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={!!selectedFormat}
        onOpenChange={(open) => {
          if (!open) setSelectedFormat(undefined)
        }}
      >
        <DialogContent size="small">
          <DialogHeader className="border-b">
            <DialogTitle>Download logs as {selectedFormat?.toLocaleUpperCase()}</DialogTitle>
            <DialogDescription>
              Export your logs with the currently applied filters
            </DialogDescription>
          </DialogHeader>
          <DialogSection className="flex flex-col gap-y-2">
            <div className="flex justify-between gap-x-2">
              <p className="text-sm mb-2">Result limit for export</p>
              <Select_Shadcn_ value={numRows} onValueChange={setNumRows}>
                <SelectTrigger_Shadcn_ className="w-24">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="100">100</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="500">500</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="1000">1000</SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            {!('date' in searchParameters) && (
              <div className="flex justify-between gap-x-2">
                <p className="text-sm mb-2">Duration to retrieve</p>
                <Select_Shadcn_ value={numHours} onValueChange={setNumHours}>
                  <SelectTrigger_Shadcn_ className="w-36">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectItem_Shadcn_ value="1">1 hour ago</SelectItem_Shadcn_>
                    <SelectItem_Shadcn_ value="12">12 hours ago</SelectItem_Shadcn_>
                    <SelectItem_Shadcn_ value="24">24 hours ago</SelectItem_Shadcn_>
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
            )}
          </DialogSection>
          <DialogFooter>
            <Button
              type="default"
              disabled={isLoading}
              onClick={() => setSelectedFormat(undefined)}
            >
              Cancel
            </Button>
            <Button type="primary" loading={isLoading} onClick={onExportData}>
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
