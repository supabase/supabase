import { ChevronDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SplitButtonGroup,
} from 'ui'

export default function ButtonSplitDropdownDemo() {
  return (
    <SplitButtonGroup className="w-fit">
      <Button type="button">Primary action</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            aria-label="More actions"
            className="shrink-0 px-1 py-1.25"
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Secondary action</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            Destructive action
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SplitButtonGroup>
  )
}
