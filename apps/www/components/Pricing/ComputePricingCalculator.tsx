import { InformationCircleIcon } from '@heroicons/react/outline'
import React, { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconInfo,
  IconTrash2,
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

  const calculateComputeAggregate = (price: number) => {
    activeInstances.map(
      (activeInstance: any) =>
        (price += parsePrice(findIntanceValueByColumn(activeInstance, 'pricing')))
    )

    return price
  }

  const calculatePrice = () => {
    let aggregatePrice = 0
    const computeAggregate = calculateComputeAggregate(aggregatePrice)

    return setActivePrice(computeAggregate + activePlan.price - COMPUTE_CREDITS)
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

  const PriceSummary = () => (
    <div className="flex flex-col gap-1 text-lighter text-right leading-4 text-xs w-full border-b pb-1 mb-1">
      <div className="flex items-center justify-between">
        <span>Plan</span>
        <span className="text-light font-mono">{activePlan.price}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Compute</span>
        <span className="text-light font-mono">{calculateComputeAggregate(0)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Compute credits</span>
        <span className="text-light font-mono">-{COMPUTE_CREDITS}</span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start mt-4 md:mt-0">
      <div className="flex flex-col gap-4 items-start flex-1 w-full lg:w-auto border-b lg:border-b-0 lg:border-r p-0 lg:pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              size="tiny"
              type="outline"
              iconRight={<IconChevronDown />}
              className="w-full min-w-[130px] flex justify-between items-center py-2"
            >
              Plan: {activePlan.name}
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
        <div
          className={cn(
            'w-full flex flex-col items-start gap-4 mt-2',
            activeInstances.length === 1 && 'border-none'
          )}
        >
          {activeInstances.map((activeInstance) => (
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
                  <span className="text-lighter text-[13px] inline lg:hidden xl:inline">
                    {findIntanceValueByColumn(activeInstance, 'memory')} /{' '}
                    {findIntanceValueByColumn(activeInstance, 'cpu')} CPU
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeInstance.position !== 0 && (
                    <button
                      aria-label="Remove item"
                      title="Remove item"
                      className="text-xs p-1 text-lighter hover:text-foreground rounded"
                      onClick={() => removeInstance(activeInstance.position)}
                    >
                      <IconTrash2 className="w-3" />
                    </button>
                  )}

                  <span>{findIntanceValueByColumn(activeInstance, 'pricing')}</span>
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
              Add Compute Instance
            </Button>
          )}
        </div>
      </div>
      <div className="pb-4 flex justify-between items-center mb-1 w-full lg:w-1/3">
        <div className="flex flex-col text-lighter items-end text-right leading-4 text-xs w-full">
          <PriceSummary />
          <div className="flex items-center gap-1 w-full justify-between">
            <span>Estimate</span>
            <span
              className="text-foreground font-mono text-base flex items-center gap-1"
              data-tip="This estimate only includes Plan and Compute add-on costs. Other resources might concur in the final invoice."
            >
              <InformationCircleIcon className="w-3 h-3" /> ${activePrice}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComputePricingCalculator
