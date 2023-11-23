'use client'
import { LogIn, LogOut } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconUser,
  Separator,
} from 'ui'

interface AvatarDropdownProps {
  currentUser: User | null
  signout: () => void
}

export default function AvatarDropdown({ currentUser, signout }: AvatarDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="flex">
        {currentUser ? (
          <button
            className="border border-foreground-lighter rounded-full w-[30px] h-[30px] bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: `url('${currentUser.user_metadata.avatar_url}')` }}
          />
        ) : (
          <Button type="outline" className="p-1.5 rounded-full" icon={<IconUser size={16} />} />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-48">
        {currentUser ? (
          <>
            <div className="px-2 py-2">
              <p className="text-xs text-foreground">{currentUser.user_metadata.full_name}</p>
              <p className="text-xs text-foreground-light">{currentUser.user_metadata.email}</p>
            </div>
            <Link href="/profile">
              <DropdownMenuItem className="space-x-2" onClick={() => {}}>
                <IconUser size={14} />
                <p>Profile</p>
              </DropdownMenuItem>
            </Link>
            <Separator />
            <a href="https://supabase.com" target="_blank" rel="noreferrer">
              <DropdownMenuItem className="space-x-2">
                <Image alt="supabase" src="/supabase.png" width={14} height={14} />
                <p>Supabase</p>
              </DropdownMenuItem>
            </a>
            <DropdownMenuItem className="space-x-2" onClick={signout}>
              <LogOut size={14} />
              <p>Sign out</p>
            </DropdownMenuItem>
          </>
        ) : (
          <div className="flex flex-col gap-y-2 p-2">
            <div className="text-xs">
              Sign in to <span className="text-foreground">database.new</span> to save your
              conversations!
            </div>
            <Button type="default" icon={<LogIn size={14} />}>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
