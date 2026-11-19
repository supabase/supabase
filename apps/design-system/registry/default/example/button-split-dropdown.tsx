import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SplitButtonGroup,
} from 'ui'

export default function ButtonSplitDropdownDemo() {
  return (
    <SplitButtonGroup className="w-fit">
      <Button type="button">Export CSV</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            aria-label="More export formats"
            className="shrink-0 px-1 py-1.25"
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Export JSON</DropdownMenuItem>
          <DropdownMenuItem>Export TSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SplitButtonGroup>
  )
}
