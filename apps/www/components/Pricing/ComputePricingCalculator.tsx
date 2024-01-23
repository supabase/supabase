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
    <div className="flex flex-col lg:grid grid-cols-4 gap-4 h-full mt-4 md:mt-0 border rounded-xl shadow p-4">
      <div className="flex justify-between w-full">
        <div className="flex flex-col text-lighter leading-4 text-xs w-full gap-4">
          <div className="h-full w-full flex flex-col justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  size="tiny"
                  // block
                  type="outline"
                  iconRight={<IconChevronDown />}
                  icon={
                    <svg
                      width="13"
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
                  }
                  className="w-full py-2"
                >
                  <div className="lg:min-w-[80px] flex items-center flex-1 grow w-full gap-1">
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
              <span
                className="text-foreground font-mono flex items-center gap-1"
                data-tip="This estimate only includes Plan and Compute add-on costs. Other resources might concur in the final invoice."
              >
                <InformationCircleIcon className="w-3 h-3" /> ${activePrice}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 col-span-3 items-start flex-1 w-full lg:w-auto border-t lg:border-t-0 lg:border-l  lg:pl-4">
        <div
          className={cn(
            'w-full flex flex-col items-start gap-y-2',
            activeInstances.length === 1 && 'border-none'
          )}
        >
          {activeInstances.map((activeInstance) => (
            <div
              className="group w-full flex flex-col gap-3 p-3 bg-surface-200 rounded border"
              key={`instance-${activeInstance.position}`}
            >
              <div className="w-full flex justify-between items-center">
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
                  <p className="text-xs">Project {activeInstance.position + 1}</p>
                </div>
                <span className="leading-3 text-sm">
                  {findIntanceValueByColumn(activeInstance, 'pricing')}
                </span>
              </div>
              <Slider_Shadcn_
                onValueChange={(value) => handleUpdateInstance(activeInstance.position, value)}
                min={1}
                max={priceSteps.length}
                step={1}
                className="w-full mt-1"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="w-full flex items-center gap-2">
                  <span className="text-lighter text-xs md:text-[13px]">
                    {findIntanceValueByColumn(activeInstance, 'memory')} /{' '}
                    {findIntanceValueByColumn(activeInstance, 'cpu')} CPU / Connections: Direct{' '}
                    {findIntanceValueByColumn(activeInstance, 'directConnections')}, Pooler{' '}
                    {findIntanceValueByColumn(activeInstance, 'poolerConnections')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeInstance.position !== 0 && (
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
          {/* {activeInstances.length < 3 ? ( */}
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
            className="w-full border-dashed"
          >
            <div className="w-full text-left">Add Compute Instance</div>
          </Button>
          {/*  ) : (
             <p className="text-foreground-muted text-xs">And so forth...</p>
           )} */}
        </div>
      </div>
      <ReactTooltip
        effect="solid"
        className="!max-w-[320px] whitespace-pre-line"
        backgroundColor="hsl(var(--background-alternative))"
      />
    </div>
  )
}

export default ComputePricingCalculator
