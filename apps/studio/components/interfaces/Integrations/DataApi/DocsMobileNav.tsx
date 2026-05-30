import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from 'ui'

import type { ShowApiKey } from '../../Docs/Docs.types'
import { LangSelector } from '../../Docs/LangSelector'
import { DocsMenu } from '@/components/interfaces/Integrations/DataApi/DocsMenu'
import { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'

interface DocsMobileNavProps {
  activePage: string
  menu: Array<ProductMenuGroup>
  selectedLang: 'js' | 'bash'
  selectedApiKey: ShowApiKey
  setSelectedLang: (lang: 'js' | 'bash') => void
  setSelectedApiKey: (key: ShowApiKey) => void
}

export const DocsMobileNav = ({
  activePage,
  menu,
  selectedLang,
  selectedApiKey,
  setSelectedLang,
  setSelectedApiKey,
}: DocsMobileNavProps) => {
  const [open, setOpen] = useState(false)

  // Close mobile nav when the active page changes
  useEffect(() => {
    setOpen(false)
  }, [activePage])

  return (
    <>
      <div className="sticky top-0 z-10 flex lg:hidden items-center border-b bg-surface-100 px-4 py-3">
        <Button type="default" icon={<Menu size={16} />} onClick={() => setOpen(true)}>
          Menu
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" size="content" className="w-72 overflow-y-auto">
          <SheetHeader className="border-b-0">
            <SheetTitle>Data API Docs</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-y-6 px-5 pb-6">
            <LangSelector
              selectedLang={selectedLang}
              selectedApiKey={selectedApiKey}
              setSelectedLang={setSelectedLang}
              setSelectedApiKey={setSelectedApiKey}
            />
            <DocsMenu activePage={activePage} menu={menu} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
