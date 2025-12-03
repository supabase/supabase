'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { useQueryState, parseAsString } from 'nuqs'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Badge,
  cn,
} from 'ui'
import { PopoverSeparator } from '@ui/components/shadcn/ui/popover'

interface FilterPopoverProps {
  allProductAreas: string[]
  allStacks: string[]
  trigger: React.ReactNode
}

export function FilterPopover({ allProductAreas, allStacks, trigger }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [productArea, setProductArea] = useQueryState(
    'product_area',
    parseAsString.withOptions({
      shallow: false,
    })
  )
  const [stack, setStack] = useQueryState(
    'stack',
    parseAsString.withOptions({
      shallow: false,
    })
  )

  function handleProductAreaClick(area: string) {
    if (productArea === area) {
      setProductArea(null)
    } else {
      setProductArea(area)
    }
  }

  function handleStackClick(tech: string) {
    if (stack === tech) {
      setStack(null)
    } else {
      setStack(tech)
    }
  }

  function handleClearAll() {
    setProductArea(null)
    setStack(null)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>{trigger}</PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[600px] p-0" align="end">
        <div className="p-4">
          {/* Header */}
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm text-foreground">Filter Threads</h3>
            <div className="flex items-center gap-2">
              {(productArea || stack) && (
                <Button
                  type="outline"
                  onClick={handleClearAll}
                  iconRight={<X className="h-4 w-4" />}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
          <PopoverSeparator />

          <div className="grid gap-8 pb-4 mt-4">
            {/* Product Area Section */}
            <div className="grid gap-3">
              <h3 className="text-sm  text-muted-foreground">Product Area</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allProductAreas.map((area) => {
                  const isSelected = productArea === area
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => handleProductAreaClick(area)}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-foreground transition-colors',
                        isSelected
                          ? 'bg-brand-200 text-brand-foreground border border-brand-300'
                          : 'bg-surface-200 hover:bg-surface-300'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-left">{area}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tech Stack Section */}
            <div className="grid gap-3">
              <h3 className="text-sm  text-muted-foreground">Tech Stack</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allStacks.map((tech) => {
                  const isSelected = stack === tech
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => handleStackClick(tech)}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-foreground transition-colors',
                        isSelected
                          ? 'bg-brand-200 text-brand-foreground border border-brand-300'
                          : 'bg-surface-200 hover:bg-surface-300'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-left">{tech}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
