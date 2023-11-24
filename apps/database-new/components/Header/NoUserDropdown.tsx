import { LogIn } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { DropdownMenuItem, DropdownMenuSeparator } from 'ui'

const NoUserDropdown = () => {
  return (
    <>
      <div className="flex flex-col gap-y-2 p-2">
        <div className="text-sm">
          Sign in to <span className="text-foreground">database.design</span> to save your database
          designs!
        </div>
      </div>
      <Link href="/login">
        <DropdownMenuItem className="space-x-2">
          <LogIn size={14} className="text-lighter" />
          <p>Sign in</p>
        </DropdownMenuItem>
      </Link>
      <DropdownMenuSeparator />
      <a href="https://supabase.com" target="_blank" rel="noreferrer">
        <DropdownMenuItem className="space-x-2">
          <Image alt="supabase" src="/supabase.png" width={14} height={14} />
          <p>Supabase</p>
        </DropdownMenuItem>
      </a>
    </>
  )
}

export default NoUserDropdown
