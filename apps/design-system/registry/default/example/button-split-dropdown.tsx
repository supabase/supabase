import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

export default function ButtonSplitDropdownDemo() {
  return (
    <div className="flex w-fit">
      <Button
        type="button"
        className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
      >
        Export CSV
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            aria-label="More export formats"
            className="shrink-0 rounded-l-none px-1 py-1.25 -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Export JSON</DropdownMenuItem>
          <DropdownMenuItem>Export TSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
