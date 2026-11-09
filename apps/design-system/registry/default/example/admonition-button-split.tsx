import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

export default function AdmonitionButtonSplitDemo() {
  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Your report is ready"
      description="Export the report in the format you need."
      actions={
        <div className="flex w-full @lg:w-auto">
          <Button
            type="button"
            className="flex-1 rounded-r-none px-3 @lg:flex-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>Export JSON</DropdownMenuItem>
              <DropdownMenuItem>Export TSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  )
}
