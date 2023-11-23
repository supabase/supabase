'use client'
import { Chat } from '@/components/Chat/Chat'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse items-between xl:flex-row xl:items-center xl:justify-between bg-alternative h-full">
      <Chat />
      {children}
    </div>
  )
}
