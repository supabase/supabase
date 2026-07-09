import { Boxes } from 'lucide-react'
import { SheetHeader, SheetTitle, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'

import { OrganizationDropdown } from '@/components/layouts/AppLayout/OrganizationDropdown'
import type { Organization } from '@/types'

const embeddedClassName =
  'bg-transparent border-0 shadow-none min-h-0 flex-1 flex flex-col overflow-hidden rounded-none'

export interface OrgSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  selectedOrganization?: Organization | null
  selectedOrganizationName?: string | null
}

export function OrgSelectorSheet({
  open,
  onOpenChange,
  onClose,
  selectedOrganization,
  selectedOrganizationName,
}: OrgSelectorSheetProps) {
  const orgLabel = selectedOrganizationName ?? selectedOrganization?.name ?? 'Select organization'

  return (
    <MobileSheetNav
      open={open}
      onOpenChange={onOpenChange}
      className="flex flex-col overflow-hidden h-[85dvh] md:max-h-[500px]"
    >
      <Tabs
        defaultValue="organization"
        className="flex flex-col flex-1 min-h-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-0 border-default p-0 shrink-0">
          <SheetTitle className="sr-only">Switch organization</SheetTitle>
          <TabsList className="w-full grid grid-cols-1 shrink-0">
            <TabsTrigger
              value="organization"
              className="text-xs flex flex-col items-center gap-1.5 px-4 py-3 data-[state=active]:border-0"
            >
              <Boxes className="shrink-0" size={16} strokeWidth={1.5} />
              <span className="truncate max-w-full text-xs leading-tight" title={orgLabel}>
                {orgLabel}
              </span>
            </TabsTrigger>
          </TabsList>
        </SheetHeader>
        <TabsContent
          value="organization"
          className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0 data-[state=inactive]:hidden"
        >
          <OrganizationDropdown embedded className={embeddedClassName} onClose={onClose} />
        </TabsContent>
      </Tabs>
    </MobileSheetNav>
  )
}
