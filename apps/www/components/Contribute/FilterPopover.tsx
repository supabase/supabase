'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  cn,
  ScrollArea,
} from 'ui'
import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'

interface FilterPopoverProps {
  allProductAreas: string[]
  allStacks: string[]
  trigger: React.ReactNode
}

export function FilterPopover({ allProductAreas, allStacks, trigger }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [productAreas, setProductAreas] = useQueryState(
    'product_area',
    parseAsArrayOf(parseAsString).withOptions({
      shallow: false,
    })
  )
  const [stacks, setStacks] = useQueryState(
    'stack',
    parseAsArrayOf(parseAsString).withOptions({
      shallow: false,
    })
  )

  function handleProductAreaClick(area: string) {
    const current = productAreas || []
    if (current.includes(area)) {
      setProductAreas(current.filter((a) => a !== area))
    } else {
      setProductAreas([...current, area])
    }
  }

  function handleStackClick(tech: string) {
    const current = stacks || []
    if (current.includes(tech)) {
      setStacks(current.filter((t) => t !== tech))
    } else {
      setStacks([...current, tech])
    }
  }

  function handleClearAll() {
    setProductAreas(null)
    setStacks(null)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>{trigger}</PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="w-[calc(100vw-2rem)] sm:w-[500px] md:w-[600px] p-0"
        align="end"
      >
        <div className="">
          {/* Header */}
          <div className="flex flex-row items-center justify-between px-4 py-2 bg-muted border-b">
            <h3 className="text-base text-foreground">Filter Threads</h3>
            <div className="flex items-center gap-2">
              {((productAreas && productAreas.length > 0) || (stacks && stacks.length > 0)) && (
                <Button
                  type="outline"
                  onClick={handleClearAll}
                  iconRight={<X className="h-4 w-4" />}
                >
                  <span className="hidden xs:inline">Clear all</span>
                  <span className="xs:hidden">Clear</span>
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[300px] sm:h-[400px] md:h-[430px]">
            <div className="grid gap-8 p-4">
              {/* Product Area Section */}
              <div className="grid gap-3 pb-0">
                <h3 className="text-sm  text-muted-foreground">Product Area</h3>
                <div className="flex flex-wrap gap-2">
                  {allProductAreas
                    .filter((area) => area !== 'Other')
                    .map((area) => {
                      const isSelected = productAreas?.includes(area) ?? false
                      return (
                        <Button
                          key={area}
                          type={isSelected ? 'primary' : 'dashed'}
                          size="tiny"
                          onClick={() => handleProductAreaClick(area)}
                          icon={isSelected ? <Check className="h-3.5 w-3.5 shrink-0" /> : undefined}
                          className="justify-start w-fit"
                        >
                          {area}
                        </Button>
                      )
                    })}
                </div>
              </div>

              {/* Tech Stack Section */}
              <div className="grid gap-3">
                <h3 className="text-sm  text-muted-foreground">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {allStacks
                    .filter((tech) => tech !== 'Other')
                    .map((tech) => {
                      const isSelected = stacks?.includes(tech) ?? false
                      return (
                        <Button
                          key={tech}
                          type={isSelected ? 'primary' : 'dashed'}
                          size="tiny"
                          onClick={() => handleStackClick(tech)}
                          icon={isSelected ? <Check className="h-3.5 w-3.5 shrink-0" /> : undefined}
                          className="justify-start w-fit"
                        >
                          {tech}
                        </Button>
                      )
                    })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
