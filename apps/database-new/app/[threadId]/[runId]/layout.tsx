import { Chat } from '@/app/[threadId]/[runId]/Chat'
import SaveSchemaDropdown from '@/components/Header/SaveSchemaDropdown'
import ToggleCodeEditorButton from '@/components/Header/ToggleCodeEditorButton'

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { threadId: string; runId: string }
}) {
  return (
    <div className="flex flex-col-reverse items-between xl:flex-row xl:items-center xl:justify-between bg-alternative h-full">
      <Chat params={params} />
      <div className="xl:hidden flex items-center gap-x-2 justify-end border-t py-2 px-2 bg-background">
        <ToggleCodeEditorButton />
        <SaveSchemaDropdown />
      </div>
      {children}
    </div>
  )
}
