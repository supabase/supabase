import { Index } from 'icons/__registry__/index'
import { Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCopy,
} from 'ui'

function Icons() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t border-l my-12">
        {Index.map((icon: any, i: number) => (
          <DropdownMenu key={i} modal={false}>
            <DropdownMenuTrigger asChild>
              <div
                key={i}
                className="
                    relative
                    min-h-32 
                    flex gap-3 flex-col items-center p-4 
                    border-b border-r
                    bg-surface-75/50 
                    justify-center hover:bg-surface-100
                    group
                    cursor-pointer
                "
              >
                <div
                  className="
                    absolute
                    w-full h-full box-content
                    transition 
                    group-hover:border 
                    group-hover:border-foreground-muted 
                    group-data-[state=open]:border 
                    group-data-[state=open]:border-foreground-muted 
                "
                ></div>
                <icon.component
                  strokeWidth={1.5}
                  size={21}
                  className="group-data-[state=open]:scale-125 transition-all"
                />
                <span className="font-mono text-sm text-foreground-lighter group-data-[state=open]:text-foreground">
                  {icon.name}
                </span>
              </div>
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
      </div>
    </>
  )
}

export { Icons }
