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
  instance.columns.find((col: any) => col.key === column)?.value

const parsePrice = (price: string) => parseInt(price.toString().replace('$', '').replace(',', ''))

const ComputePricingCalculator = () => {
  const computeInstances = pricingAddOn.database.rows
  const priceSteps = computeInstances.map((instance) =>
    parsePrice(findIntanceValueByColumn(instance, 'pricing'))
  )
  const COMPUTE_CREDITS = 10

  const [activePlan, setActivePlan] = useState(plans[0])
  const [activeInstance, setActiveInstance] = useState(computeInstances[0])
  const [activePrice, setActivePrice] = useState(activePlan.price)

  useEffect(() => {
    setActivePrice(activePlan.price + priceSteps[0] - COMPUTE_CREDITS)
  }, [])

  const changeInstance = (value: number[]) => {
    setActiveInstance(computeInstances[value[0] - 1])
  }

  const handlePriceChange = () => {
    const instancePrice = parsePrice(findIntanceValueByColumn(activeInstance, 'pricing'))
    setActivePrice(instancePrice - COMPUTE_CREDITS + activePlan.price)
  }

  useEffect(() => {
    handlePriceChange()
  }, [activeInstance, activePlan])

  return (
    <div className="flex flex-col gap-4 items-start">
      <div className="pb-4 flex justify-between items-center border-b mb-1 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              size="tiny"
              type="outline"
              iconRight={<IconChevronDown />}
              className="w-full min-w-[200px] flex justify-between items-center py-2"
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
      <Slider_Shadcn_
        onValueChange={changeInstance}
        min={1}
        max={priceSteps.length}
        step={1}
        className="w-full"
      />
      <div className="flex items-center gap-2">
        <Badge
          className="rounded-md w-16 text-center flex justify-center"
          color={findIntanceValueByColumn(activeInstance, 'plan') === 'Starter' ? 'scale' : 'brand'}
        >
          {findIntanceValueByColumn(activeInstance, 'plan')}
        </Badge>
        <span className="text-sm">
          {findIntanceValueByColumn(activeInstance, 'memory')} /{' '}
          {findIntanceValueByColumn(activeInstance, 'cpu')} CPU
        </span>
      </div>
    </div>
  )
}

export default ComputePricingCalculator
