import {
  cn,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogTitle,
} from 'ui'

import type { GuideSummary } from '../lib/guides'

export interface GuideSearchDialogProps {
  guides: GuideSummary[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

interface GuideResultProps {
  guide: GuideSummary
  onGuideSelect: (href: string) => void
}

const COMMAND_CLASS = cn(
  '**:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-3 **:[[cmdk-item]]:py-2.5',
  '**:[[cmdk-list]]:max-h-[min(420px,60vh)] **:[[cmdk-list]]:overflow-y-auto **:[[cmdk-list]]:p-1.5',
  '**:[[cmdk-list]]:box-content **:[[cmdk-list]]:h-(--cmdk-list-height) **:[[cmdk-list]]:transition-[height]',
  '**:[[cmdk-list]]:duration-200 **:[[cmdk-list]]:ease-[cubic-bezier(0.23,1,0.32,1)]',
  'motion-reduce:**:[[cmdk-list]]:transition-none'
)

export const GuideSearchDialog = ({ guides, isOpen, onOpenChange }: GuideSearchDialogProps) => {
  const handleGuideSelect = (href: string) => window.location.assign(href)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        centered={false}
        aria-describedby={undefined}
        className="mx-auto overflow-hidden p-0 shadow-codeblock"
      >
        <DialogTitle className="sr-only">Search guides</DialogTitle>
        <Command className={COMMAND_CLASS}>
          <CommandInput placeholder="Search guides" />
          <CommandList>
            <CommandEmpty className="px-3 py-6 text-center text-sm text-foreground-lighter">
              No guide titles match your search. Try a shorter or different term.
            </CommandEmpty>
            {guides.map((guide) => (
              <GuideResult key={guide.id} guide={guide} onGuideSelect={handleGuideSelect} />
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const GuideResult = ({ guide, onGuideSelect }: GuideResultProps) => {
  const handleSelect = () => onGuideSelect(guide.href)

  return (
    <CommandItem
      value={guide.title}
      onSelect={handleSelect}
      className="flex items-center justify-between gap-4 rounded-md text-sm text-foreground"
    >
      <span className="truncate">{guide.title}</span>
      <span className="shrink-0 text-xs text-foreground-lighter">{guide.topics.join(', ')}</span>
    </CommandItem>
  )
}
