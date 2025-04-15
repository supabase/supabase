import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from 'ui'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from 'ui'
import { FilterIcon } from 'lucide-react'
import { DataTableFilterControls } from './data-table-filter-controls'
import { useHotKey } from 'components/interfaces/DataTableDemo/hooks/use-hot-key'
import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { Kbd } from 'components/interfaces/DataTableDemo/components/custom/kbd'
import { useMediaQuery } from 'components/interfaces/DataTableDemo/hooks/use-media-query'

export function DataTableFilterControlsDrawer() {
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null)
  const isMobile = useMediaQuery('(max-width: 640px)')

  useHotKey(() => {
    triggerButtonRef.current?.click()
  }, 'b')

  return (
    <Drawer>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DrawerTrigger asChild>
              <Button
                ref={isMobile ? triggerButtonRef : null}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <FilterIcon className="w-4 h-4" />
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              Toggle controls with{' '}
              <Kbd className="ml-1 text-muted-foreground group-hover:text-accent-foreground">
                <span className="mr-1">⌘</span>
                <span>B</span>
              </Kbd>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DrawerContent className="max-h-[calc(100dvh-4rem)]">
        <VisuallyHidden>
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Adjust your table filters</DrawerDescription>
          </DrawerHeader>
        </VisuallyHidden>
        <div className="px-4 flex-1 overflow-y-auto">
          <DataTableFilterControls />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
