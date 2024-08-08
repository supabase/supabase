import {
  ContextMenu_Shadcn_,
  ContextMenuCheckboxItem_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuLabel_Shadcn_,
  ContextMenuRadioGroup_Shadcn_,
  ContextMenuRadioItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuShortcut_Shadcn_,
  ContextMenuSub_Shadcn_,
  ContextMenuSubContent_Shadcn_,
  ContextMenuSubTrigger_Shadcn_,
  ContextMenuTrigger_Shadcn_,
} from 'ui'

export default function ContextMenuDemo() {
  return (
    <ContextMenu_Shadcn_>
      <ContextMenuTrigger_Shadcn_ className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger_Shadcn_>
      <ContextMenuContent_Shadcn_ className="w-64">
        <ContextMenuItem_Shadcn_ inset>
          Back
          <ContextMenuShortcut_Shadcn_>⌘[</ContextMenuShortcut_Shadcn_>
        </ContextMenuItem_Shadcn_>
        <ContextMenuItem_Shadcn_ inset disabled>
          Forward
          <ContextMenuShortcut_Shadcn_>⌘]</ContextMenuShortcut_Shadcn_>
        </ContextMenuItem_Shadcn_>
        <ContextMenuItem_Shadcn_ inset>
          Reload
          <ContextMenuShortcut_Shadcn_>⌘R</ContextMenuShortcut_Shadcn_>
        </ContextMenuItem_Shadcn_>
        <ContextMenuSub_Shadcn_>
          <ContextMenuSubTrigger_Shadcn_ inset>More Tools</ContextMenuSubTrigger_Shadcn_>
          <ContextMenuSubContent_Shadcn_ className="w-48">
            <ContextMenuItem_Shadcn_>
              Save Page As...
              <ContextMenuShortcut_Shadcn_>⇧⌘S</ContextMenuShortcut_Shadcn_>
            </ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_>Create Shortcut...</ContextMenuItem_Shadcn_>
            <ContextMenuItem_Shadcn_>Name Window...</ContextMenuItem_Shadcn_>
            <ContextMenuSeparator_Shadcn_ />
            <ContextMenuItem_Shadcn_>Developer Tools</ContextMenuItem_Shadcn_>
          </ContextMenuSubContent_Shadcn_>
        </ContextMenuSub_Shadcn_>
        <ContextMenuSeparator_Shadcn_ />
        <ContextMenuCheckboxItem_Shadcn_ checked>
          Show Bookmarks Bar
          <ContextMenuShortcut_Shadcn_>⌘⇧B</ContextMenuShortcut_Shadcn_>
        </ContextMenuCheckboxItem_Shadcn_>
        <ContextMenuCheckboxItem_Shadcn_>Show Full URLs</ContextMenuCheckboxItem_Shadcn_>
        <ContextMenuSeparator_Shadcn_ />
        <ContextMenuRadioGroup_Shadcn_ value="pedro">
          <ContextMenuLabel_Shadcn_ inset>People</ContextMenuLabel_Shadcn_>
          <ContextMenuSeparator_Shadcn_ />
          <ContextMenuRadioItem_Shadcn_ value="pedro">Pedro Duarte</ContextMenuRadioItem_Shadcn_>
          <ContextMenuRadioItem_Shadcn_ value="colm">Colm Tuite</ContextMenuRadioItem_Shadcn_>
        </ContextMenuRadioGroup_Shadcn_>
      </ContextMenuContent_Shadcn_>
    </ContextMenu_Shadcn_>
  )
}
