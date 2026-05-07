import { OrganizationDropdown } from 'components/layouts/AppLayout/OrganizationDropdown'
import { Boxes } from 'lucide-react'
import type { Organization } from 'types'
import {
  SheetHeader,
  SheetTitle,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import MobileSheetNav from 'ui-patterns/MobileSheetNav/MobileSheetNav'

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
      <Tabs_Shadcn_
        defaultValue="organization"
        className="flex flex-col flex-1 min-h-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-0 border-default p-0 shrink-0">
          <SheetTitle className="sr-only">Switch organization</SheetTitle>
          <TabsList_Shadcn_ className="w-full grid grid-cols-1 shrink-0">
            <TabsTrigger_Shadcn_
              value="organization"
              className="text-xs flex flex-col items-center gap-1.5 px-4 py-3 data-[state=active]:border-0"
            >
              <Boxes className="shrink-0" size={16} strokeWidth={1.5} />
              <span className="truncate max-w-full text-xs leading-tight" title={orgLabel}>
                {orgLabel}
              </span>
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
        </SheetHeader>
        <TabsContent_Shadcn_
          value="organization"
          className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0 p-0 data-[state=inactive]:hidden"
        >
          <OrganizationDropdown embedded className={embeddedClassName} onClose={onClose} />
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </MobileSheetNav>
  )
}
