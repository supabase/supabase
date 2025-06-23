import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { components } from 'api-types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Slider_Shadcn_,
  cn,
} from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import pricingAddOn from '~/data/PricingAddOnTable.json'

type InfraComputeSize = components['schemas']['ProjectInfo']['infra_compute_size'] | '>16XL'

interface BaseAttr<T = string> {
  key: string
  title: string
  value: T
  url?: string
}

interface PlanAttr extends BaseAttr<InfraComputeSize> {
  key: 'plan'
}

interface PricingAttr extends BaseAttr {
  key: 'pricing'
  url: string
  parsedValue: number | null
}

interface CpuAttr extends BaseAttr {
  key: 'cpu'
}

interface DedicatedAttr extends BaseAttr<boolean> {
  key: 'dedicated'
}

interface MemoryAttr extends BaseAttr {
  key: 'memory'
}

interface DirectConnectionAttr extends BaseAttr {
  key: 'directConnections'
}

interface PoolerConnectionsAttr extends BaseAttr {
  key: 'poolerConnections'
}

type ComputeAttr =
  | PlanAttr
  | PricingAttr
  | CpuAttr
  | DedicatedAttr
  | MemoryAttr
  | DirectConnectionAttr
  | PoolerConnectionsAttr

type ComputeInstance = {
  [K in ComputeAttr['key']]: Extract<ComputeAttr, { key: K }>
}

type ActiveComputeInstance = ComputeInstance & { position: number }

type Plan = { name: string; price: number }

const plans: Plan[] = [
  {
    name: 'Pro',
    price: 25,
  },
  {
    name: 'Team',
    price: 599,
  },
]

// Base discount credits that come with every paid plan
const COMPUTE_CREDITS = 10

const parsePrice = (price?: string) => {
  if (!price) return undefined
  const cleaned = price.replace(/[$,]/g, '')
  const parsed = parseInt(cleaned, 10)
  return isNaN(parsed) ? undefined : parsed
}

const calculateComputeAggregate = (activeInstances: ActiveComputeInstance[]) => {
  let total = 0

  for (const instance of activeInstances) {
    const price = instance.pricing.parsedValue
    if (price === null) return null
    total += price
  }

  return total
}

const addPricePlanAndCredits = (price: number | null, planPrice: Plan['price']) => {
  if (price === null) return null
  return price + planPrice - COMPUTE_CREDITS
}

// Transform raw pricing data into strongly typed compute instances
const computeInstances: ComputeInstance[] = pricingAddOn.database.rows.map((row) => {
  // Convert columns array into an object where each key maps to its attribute object
  const instance = row.columns.reduce(
    (acc, attr) => ({ ...acc, [attr.key]: attr }),
    {} as ComputeInstance
  )

  // Parse the pricing value (string like "$10") into a number
  // If parsing fails (e.g., "Contact Us"), fallback to null
  instance.pricing.parsedValue = parsePrice(instance.pricing.value as unknown as string) ?? null

  return instance
})

const priceSteps = computeInstances.map((instance) => instance.pricing.parsedValue)

const ComputePricingCalculator = () => {
  const [activePlan, setActivePlan] = useState<Plan>(plans[0])
  const [activeInstances, setActiveInstances] = useState<ActiveComputeInstance[]>([
    { ...computeInstances[0], position: 0 },
  ])
  const [activePrice, setActivePrice] = useState(() =>
    addPricePlanAndCredits(priceSteps[0], activePlan.price)
  )

  const handleUpdateInstance = (position: number, [value]: number[]) => {
    const newActiveInstances = activeInstances.map((activeInstance) => {
      // only update the instance corresponding to the correct slider
      if (activeInstance.position === position) {
        return { ...computeInstances[value - 1], position }
      } else {
        return activeInstance
      }
    })

    setActiveInstances(newActiveInstances)
    setActivePrice(
      addPricePlanAndCredits(calculateComputeAggregate(newActiveInstances), activePlan.price)
    )
  }

  const addInstance = () => {
    const newActiveInstances = [
      ...activeInstances,
      { ...computeInstances[0], position: activeInstances.length },
    ]

    setActiveInstances(newActiveInstances)
    setActivePrice(
      addPricePlanAndCredits(calculateComputeAggregate(newActiveInstances), activePlan.price)
    )
  }

  const removeInstance = (position: number) => {
    const newActiveInstances = activeInstances
      .filter((activeInstance) => activeInstance.position !== position)
      .map((instance, index) => {
        instance.position = index
        return instance
      })

    setActiveInstances(newActiveInstances)
    setActivePrice(
      addPricePlanAndCredits(calculateComputeAggregate(newActiveInstances), activePlan.price)
    )
  }

  const findSliderComputeValue = (activeInstance: ActiveComputeInstance) => {
    // find index of compute based on active compute name
    const selectedCompute = computeInstances
      .map((compute) => compute.plan.value)
      .indexOf(activeInstance.plan.value)

    return [selectedCompute + 1]
  }

  const PriceSummary = () => {
    const computeAggregate = calculateComputeAggregate(activeInstances)

    return (
      <div className="flex flex-col gap-1 text-lighter text-right leading-4 w-full border-b pb-1 mb-1">
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">Plan</span>
          <span className="text-light font-mono" translate="no">
            ${activePlan.price}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">Total Compute</span>
          <span className="text-light font-mono">
            {computeAggregate === null ? '-' : `$${computeAggregate}`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">Compute Credits</span>
          <span className="text-light font-mono" translate="no">
            - ${COMPUTE_CREDITS}
          </span>
        </div>
      </div>
    )
  }

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
                  iconRight={<ChevronDown />}
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
                {plans.map((plan) => (
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
                <InfoTooltip side="top" className="max-w-[250px]">
                  This estimate only includes Plan and Compute add-on monthly costs. Other resources
                  might concur in the final invoice.
                </InfoTooltip>
                {activePrice === null ? '-' : `$${activePrice}`}
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
                  <ComputeBadge infraComputeSize={activeInstance.plan.value} />
                  <p className="text-xs text-foreground-lighter">
                    Project {activeInstance.position + 1}
                  </p>
                </div>
                <span className="leading-3 text-sm" translate="no">
                  {activeInstance.pricing.value}
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
                    {activeInstance.memory.value} {activeInstance.memory.title} /{' '}
                    {activeInstance.cpu.value} {activeInstance.cpu.title} / Connections: Direct{' '}
                    {activeInstance.directConnections.value}, Pooler{' '}
                    {activeInstance.poolerConnections.value}
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
                      <Trash2 className="w-3 h-3" />
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
            icon={<Plus />}
            onClick={addInstance}
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
