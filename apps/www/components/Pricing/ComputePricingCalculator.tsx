import React, { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  Slider_Shadcn_,
  cn,
} from 'ui'
import pricingAddOn from '~/data/PricingAddOnTable.json'

const plans = [
  {
    name: 'Pro',
    price: 25,
  },
  {
    name: 'Teams',
    price: 599,
  },
]

const findIntanceValueByColumn = (instance: any, column: string) =>
  instance.columns?.find((col: any) => col.key === column)?.value

const parsePrice = (price: string) => parseInt(price?.toString().replace('$', '').replace(',', ''))

const ComputePricingCalculator = () => {
  const computeInstances = pricingAddOn.database.rows
  const priceSteps = computeInstances.map((instance) =>
    parsePrice(findIntanceValueByColumn(instance, 'pricing'))
  )
  const COMPUTE_CREDITS = 10

  const [activePlan, setActivePlan] = useState(plans[0])
  const [activeInstances, setActiveInstances] = useState([{ ...computeInstances[0], position: 0 }])
  const [activePrice, setActivePrice] = useState(activePlan.price)

  useEffect(() => {
    setActivePrice(activePlan.price + priceSteps[0] - COMPUTE_CREDITS)
  }, [])

  const handleUpdateInstance = (index: number, value: number[]) => {
    const newArray = activeInstances.map((activeInstance) => {
      // only update the instance corresponding to the correct slider
      if (activeInstance.position === index) {
        return { ...computeInstances[value[0] - 1], position: index }
      } else {
        return activeInstance
      }
    })

    setActiveInstances(newArray)
  }

  const calculatePrice = () => {
    let aggregatePrice = 0
    activeInstances.map(
      (activeInstance: any) =>
        (aggregatePrice += parsePrice(findIntanceValueByColumn(activeInstance, 'pricing')))
    )

    return setActivePrice(aggregatePrice + activePlan.price - COMPUTE_CREDITS)
  }

  useEffect(() => {
    calculatePrice()
  }, [activeInstances, activePlan])

  const removeInstance = (position: number) => {
    const newArray = activeInstances
      .filter((activeInstance) => activeInstance.position !== position)
      .map((instance, index) => {
        instance.position = index
        return instance
      })

    setActiveInstances(newArray)
  }

  return (
    <div className="flex flex-col gap-4 items-start xl:pl-20 mt-4 md:mt-0">
      <div className="pb-4 flex justify-between items-center border-b mb-1 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              size="tiny"
              type="outline"
              iconRight={<IconChevronDown />}
              className="w-full min-w-[100px] flex justify-between items-center py-2"
            >
              {activePlan.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            {plans.map((plan: any) => (
              <DropdownMenuItem key="custom-expiry" onClick={() => setActivePlan(plan)}>
                {plan.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex flex-col text-lighter text-right leading-4 text-sm">
          Estimated Price<span className="text-foreground text-base font-mono">{activePrice}$</span>
        </div>
      </div>
      <div
        className={cn(
          'w-full flex flex-col items-start gap-4',
          activeInstances.length === 1 && 'border-none'
        )}
      >
        {activeInstances.map((activeInstance, index) => (
          <div
            className={cn(
              'w-full flex flex-col gap-4 border-b border-muted pb-3 mb-1',
              activeInstances.length === 1 && 'border-none'
            )}
            key={`instance-${activeInstance.position}`}
          >
            <Slider_Shadcn_
              onValueChange={(value) => handleUpdateInstance(activeInstance.position, value)}
              min={1}
              max={priceSteps.length}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge
                  className="rounded-md w-16 text-center flex justify-center"
                  color={
                    findIntanceValueByColumn(activeInstance, 'plan') === 'Starter'
                      ? 'scale'
                      : 'brand'
                  }
                >
                  {findIntanceValueByColumn(activeInstance, 'plan')}
                </Badge>
                <span className="text-lighter">
                  {findIntanceValueByColumn(activeInstance, 'memory')} /{' '}
                  {findIntanceValueByColumn(activeInstance, 'cpu')} CPU
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeInstance.position !== 0 && (
                  <button
                    className="text-xs p-1 text-lighter hover:text-foreground rounded"
                    onClick={() => removeInstance(activeInstance.position)}
                  >
                    Remove
                  </button>
                )}

                <span>{findIntanceValueByColumn(activeInstance, 'pricing')}$</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        {activeInstances.length < 3 && (
          <Button
            size="tiny"
            type="outline"
            onClick={() =>
              setActiveInstances([
                ...activeInstances,
                { ...computeInstances[0], position: activeInstances.length },
              ])
            }
          >
            Add Instance
          </Button>
        )}
      </div>
    </div>
  )
}

export default ComputePricingCalculator
