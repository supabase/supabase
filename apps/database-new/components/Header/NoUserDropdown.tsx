import { LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconUser,
  SidePanel,
} from 'ui'

const NoUserDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="flex">
        <Button
          type="outline"
          className="p-1.5 rounded-full"
          icon={<IconUser size={16} strokeWidth={2} />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-48">
        <div className="flex flex-col gap-y-2 p-2">
          <div className="text-xs">
            Sign in to <span className="text-foreground">database.design</span> to save your
            conversations!
          </div>
        </div>
        <Link href="/login">
          <DropdownMenuItem className="space-x-2">
            <LogIn size={14} />
            <p>Sign in</p>
          </DropdownMenuItem>
        </Link>
        <SidePanel.Separator />
        <a href="https://supabase.com" target="_blank" rel="noreferrer">
          <DropdownMenuItem className="space-x-2">
            <Image alt="supabase" src="/supabase.png" width={14} height={14} />
            <p>Supabase</p>
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NoUserDropdown
