'use client'
import { Chat } from '@/app/[threadId]/Chat'
import SaveSchemaDropdown from '@/components/Header/SaveSchemaDropdown'
import ToggleCodeEditorButton from '@/components/Header/ToggleCodeEditorButton'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse items-between xl:flex-row xl:items-center xl:justify-between bg-alternative h-full">
      <Chat />
      <div className="xl:hidden flex items-center gap-x-2 justify-end border-t py-2 px-2 bg-background">
        <ToggleCodeEditorButton />
        <SaveSchemaDropdown />
      </div>
      {children}
    </div>
  )
}
