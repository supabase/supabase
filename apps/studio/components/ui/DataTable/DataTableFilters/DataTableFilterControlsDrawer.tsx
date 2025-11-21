import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { FilterIcon } from 'lucide-react'
import { useRef } from 'react'

import { useHotKey } from 'hooks/ui/useHotKey'
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Kbd } from '../primitives/Kbd'
import { DataTableFilterControls } from './DataTableFilterControls'

export function DataTableFilterControlsDrawer() {
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const isMobile = useMediaQuery('(max-width: 640px)')

  useHotKey(() => {
    triggerButtonRef.current?.click()
  }, 'b')

  return (
    <Drawer>
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button className="h-9 w-9" ref={isMobile ? triggerButtonRef : null}>
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
            <Button type="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
