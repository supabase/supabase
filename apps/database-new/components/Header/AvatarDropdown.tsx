'use client'

import { logout } from '@/app/actions'
import { User } from '@supabase/supabase-js'
import { HelpCircle, LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, IconUser } from 'ui'

interface AvatarDropdownProps {
  user: User
}

export default function AvatarDropdown({ user }: AvatarDropdownProps) {
  return (
    <>
      <div className="px-2 py-2">
        <p className="text-sm text-foreground">{user.user_metadata.full_name}</p>
        <p className="text-sm text-foreground-light">{user.user_metadata.email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <Link href="/profile">
          <DropdownMenuItem className="space-x-2" onClick={() => {}}>
            <IconUser size={14} strokeWidth={1.5} className="text-lighter" />
            <p>Profile</p>
          </DropdownMenuItem>
        </Link>
        <Link href="/faq">
          <DropdownMenuItem className="space-x-2" onClick={() => {}}>
            <HelpCircle size={14} strokeWidth={1.5} className="text-lighter" />
            <p>FAQs</p>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <a href="https://supabase.com" target="_blank" rel="noreferrer">
          <DropdownMenuItem className="space-x-2">
            <Image alt="supabase" src="/supabase.png" width={14} height={14} />
            <p>Supabase</p>
          </DropdownMenuItem>
        </a>
      </DropdownMenuGroup>
      <form action={logout}>
        <DropdownMenuItem className="space-x-2 w-full" asChild>
          <button type="submit">
            <LogOut size={14} strokeWidth={1.5} className="text-lighter" />
            <p>Sign out</p>
          </button>
        </DropdownMenuItem>
      </form>
    </>
  )
}
