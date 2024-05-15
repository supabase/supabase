import React, { useEffect, useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/outline'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconPlus,
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
    name: 'Team',
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
  // Base discount credits that come with every paid plan
  const COMPUTE_CREDITS = 10

  const [activePlan, setActivePlan] = useState(plans[0])
  const [activeInstances, setActiveInstances] = useState([{ ...computeInstances[0], position: 0 }])
  // Final calculated price: plan cost + compute aggregate - compute credits
  const [activePrice, setActivePrice] = useState(activePlan.price + priceSteps[0] - COMPUTE_CREDITS)

  useEffect(() => {
    setActivePrice(activePlan.price + priceSteps[0] - COMPUTE_CREDITS)
  }, [])

  const handleUpdateInstance = (position: number, value: number[]) => {
    const newArray = activeInstances.map((activeInstance) => {
      // only update the instance corresponding to the correct slider
      if (activeInstance.position === position) {
        return { ...computeInstances[value[0] - 1], position }
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

  const findSliderComputeValue = (activeInstance: any) => {
    // find index of compute based on active compute name
    const selectedCompute = computeInstances
      .map((compute) => findIntanceValueByColumn(compute, 'plan'))
      .indexOf(findIntanceValueByColumn(activeInstance, 'plan'))

    return [selectedCompute + 1]
  }

  const PriceSummary = () => (
    <div className="flex flex-col gap-1 text-lighter text-right leading-4 w-full border-b pb-1 mb-1">
      <div className="flex items-center justify-between">
        <span className="text-foreground-muted">Plan</span>
        <span className="text-light font-mono">${activePlan.price}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-foreground-muted">Total Compute</span>
        <span className="text-light font-mono">${calculateComputeAggregate(0)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-foreground-muted">Compute Credits</span>
        <span className="text-light font-mono">- ${COMPUTE_CREDITS}</span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:grid grid-cols-4 gap-4 h-full mt-4 lg:mt-0 border border-strong rounded-xl p-4">
      <div className="flex justify-between w-full">
        <div className="flex flex-col text-lighter leading-4 text-xs w-full gap-4">
          <div className="h-full w-full flex flex-col justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="tiny"
                  type="outline"
                  iconRight={<IconChevronDown />}
                  icon={
                    activePlan.name === 'Pro' ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="3.5"
                          y="3.5"
                          width="6.77393"
                          height="6.77393"
                          rx="1.5"
                          stroke="hsl(var(--foreground-default))"
                        />
                        <rect
                          x="5.55078"
                          y="5.55127"
                          width="2.67139"
                          height="2.67139"
                          rx="1.33569"
                          stroke="hsl(var(--foreground-muted))"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 13 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="3.26953"
                          y="3.61279"
                          width="6.77393"
                          height="6.77393"
                          rx="1.5"
                          stroke="hsl(var(--foreground-muted))"
                        />
                        <rect
                          x="1.08984"
                          y="1.43359"
                          width="11.1323"
                          height="11.1323"
                          rx="3.5"
                          stroke="hsl(var(--foreground-default))"
                        />
                        <rect
                          x="5.32031"
                          y="5.66406"
                          width="2.67139"
                          height="2.67139"
                          rx="1.33569"
                          stroke="hsl(var(--foreground-muted))"
                        />
                      </svg>
                    )
                  }
                  className="w-full pl-1 py-2"
                >
                  <div className="lg:min-w-[80px] flex items-center grow w-full gap-1">
                    <span className="text-foreground-light">Plan</span>{' '}
                    <span>{activePlan.name}</span>
                  </div>
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
          </div>
          <div>
            <PriceSummary />
            <div className="flex items-center gap-1 w-full justify-between">
              <span>Total Estimate</span>
              <span className="text-foreground font-mono flex items-center gap-1">
                <InformationCircleIcon
                  data-tip="This estimate only includes Plan and Compute add-on monthly costs. Other resources might concur in the final invoice."
                  className="w-3 h-3"
                />{' '}
                ${activePrice}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 col-span-3 items-start flex-1 w-full lg:w-auto lg:border-l lg:pl-4">
        <div
          className={cn(
            'w-full flex flex-col items-start gap-y-2',
            activeInstances.length === 1 && 'border-none'
          )}
        >
          {activeInstances.map((activeInstance, index) => (
            <div
              className="group w-full flex flex-col gap-3 p-3 bg-surface-200 rounded border"
              key={`instance-${index}`}
            >
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge
                    className="rounded-md w-16 text-center flex justify-center font-mono uppercase"
                    variant={
                      findIntanceValueByColumn(activeInstance, 'plan') ===
                      findIntanceValueByColumn(computeInstances[0], 'plan')
                        ? 'default'
                        : 'brand'
                    }
                  >
                    {findIntanceValueByColumn(activeInstance, 'plan')}
                  </Badge>
                  <p className="text-xs text-foreground-lighter">
                    Project {activeInstance.position + 1}
                  </p>
                </div>
                <span className="leading-3 text-sm">
                  {findIntanceValueByColumn(activeInstance, 'pricing')}
                </span>
              </div>
              <Slider_Shadcn_
                onValueChange={(value) => handleUpdateInstance(activeInstance.position, value)}
                value={findSliderComputeValue(activeInstance)}
                min={1}
                key={`${index}-${activeInstance.position}`}
                max={priceSteps.length}
                step={1}
                className="w-full mt-1"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="w-full flex items-center gap-2">
                  <span className="text-lighter text-xs md:text-[13px]">
                    {findIntanceValueByColumn(activeInstance, 'memory')} RAM /{' '}
                    {findIntanceValueByColumn(activeInstance, 'cpu')} CPU / Connections: Direct{' '}
                    {findIntanceValueByColumn(activeInstance, 'directConnections')}, Pooler{' '}
                    {findIntanceValueByColumn(activeInstance, 'poolerConnections')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeInstances.length > 1 && (
                    <button
                      aria-label="Remove item"
                      title="Remove item"
                      className="p-1 text-lighter hover:text-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeInstance(activeInstance.position)}
                    >
                      <IconTrash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full">
          <Button
            size="tiny"
            type="outline"
            block
            icon={<IconPlus />}
            onClick={() =>
              setActiveInstances([
                ...activeInstances,
                { ...computeInstances[0], position: activeInstances.length },
              ])
            }
            className="w-full border-dashed text-foreground-light hover:text-foreground"
          >
            <span className="w-full text-left">Add Project</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ComputePricingCalculator
