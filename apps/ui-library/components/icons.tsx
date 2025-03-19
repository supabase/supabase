import { Index } from 'icons/__registry__/index'
import { Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Grid, GridItem } from './grid'

function Icons() {
  return (
    <>
      <Grid>
        {Index.map((icon: any, i: number) => (
          <DropdownMenu key={i} modal={false}>
            <DropdownMenuTrigger asChild>
              <GridItem>
                <icon.component
                  strokeWidth={1.5}
                  size={21}
                  className="group-data-[state=open]:scale-125 transition-all"
                />
                <span className="bg-surface-100 rounded-full border px-2 font-mono text-xs text-foreground-lighter group-data-[state=open]:text-foreground">
                  {icon.name}
                </span>
              </GridItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={() => navigator.clipboard.writeText(icon.name)}
                >
                  <Copy size={14} strokeWidth={1} />
                  Copy name
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={() => navigator.clipboard.writeText(icon.jsx)}
                >
                  <Copy size={14} strokeWidth={1} />
                  Copy JSX
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={() => navigator.clipboard.writeText(icon.import)}
                >
                  <Copy size={14} strokeWidth={1} />
                  Copy import path
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onSelect={() => navigator.clipboard.writeText(icon.svg)}
                >
                  <Copy size={14} strokeWidth={1} />
                  Copy SVG
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </Grid>
    </>
  )
}

export { Icons }
