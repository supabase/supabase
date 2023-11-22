'use client'
import { Chat } from '@/components/Chat/Chat'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-center justify-between bg-alternative h-full">
      <Chat />
      {children}
    </div>
  )
}
