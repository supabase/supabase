import { UserPlus } from 'lucide-react'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'
import ThemeSwitcher from './theme-switcher'

export default function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>
          <Image
            src="https://avatars.githubusercontent.com/u/8291514?v=4"
            alt="avatar"
            width={15}
            height={15}
            className="w-7 h-7 rounded-full"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <div className="p-2 flex gap-3 items-center">
          <Image
            src="https://avatars.githubusercontent.com/u/8291514?v=4"
            alt="avatar"
            width={16}
            height={16}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex flex-col gap-0">
            <span className="text-sm text-foreground-light truncate">Jonathan Summers-Muir</span>
            <span className="text-xs text-foreground-lighter truncate">
              jon.summers.muir@gmail.com
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Account settings</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <ThemeSwitcher />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
