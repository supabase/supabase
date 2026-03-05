import pricingAddOn from '~/data/PricingAddOnTable.json'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, cn, Slider_Shadcn_ } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

const findInstanceValueByColumn = (instance: any, column: string) =>
  instance.columns?.find((col: any) => col.key === column)?.value

const parsePrice = (price: string) => {
  const n = parseInt(price?.toString().replace('$', '').replace(',', ''), 10)
  return Number.isNaN(n) ? 0 : n
}

interface ComputePricingCalculatorProps {
  activePlan?: {
    name: string
    price: number
  }
}

const NewComputePricingCalculator = ({
  activePlan = { name: 'Pro', price: 25 },
}: ComputePricingCalculatorProps) => {
  // Filter out rows with no specific pricing
  const computeInstances = pricingAddOn.database.rows.filter((row) =>
    row.columns.some((it) => it.key === 'pricing' && it.value !== 'Contact Us')
  )
  const priceSteps = computeInstances.map((instance) =>
    parsePrice(findInstanceValueByColumn(instance, 'pricing'))
  )
  // Base discount credits that come with every paid plan
  const COMPUTE_CREDITS = 10

  const [activeInstances, setActiveInstances] = useState([{ ...computeInstances[0], position: 0 }])
  // Final calculated price: plan cost + compute aggregate - compute credits
  const [activePrice, setActivePrice] = useState(activePlan.price + priceSteps[0] - COMPUTE_CREDITS)
  const [hasInteractedWithSlider, setHasInteractedWithSlider] = useState(false)

  const handleUpdateInstance = (position: number, value: number[]) => {
    setHasInteractedWithSlider(true)
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
    return activeInstances.reduce(
      (acc, activeInstance: any) =>
        acc + parsePrice(findInstanceValueByColumn(activeInstance, 'pricing')),
      price
    )
  }

  useEffect(() => {
    const computeAggregate = calculateComputeAggregate(0)
    setActivePrice(Math.max(0, computeAggregate + activePlan.price - COMPUTE_CREDITS))
  }, [activeInstances, activePlan])

  const removeInstance = (position: number) => {
    const newArray = activeInstances
      .filter((activeInstance) => activeInstance.position !== position)
      .map((instance, index) => ({ ...instance, position: index }))

    setActiveInstances(newArray)
  }

  const findSliderComputeValue = (activeInstance: any) => {
    // find index of compute based on active compute name
    const selectedCompute = computeInstances
      .map((compute) => findInstanceValueByColumn(compute, 'plan'))
      .indexOf(findInstanceValueByColumn(activeInstance, 'plan'))

    return [selectedCompute + 1]
  }

  return (
    <div className="flex flex-col lg:grid grid-cols-4 gap-4 border border-strong rounded-xl p-4">
      <div className="flex flex-col text-lighter leading-4 text-xs w-full gap-4">
        <div>
          <p className="text-foreground-light text-xs mb-2">Monthly estimate:</p>
          <div className="flex flex-col gap-1 text-lighter text-right leading-4 w-full border-b pb-1 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Plan subscription</span>
              <span className="text-light font-mono" translate="no">
                ${activePlan.price}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Total Compute</span>
              <span className="text-light font-mono">${calculateComputeAggregate(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Compute Credits</span>
              <span className="text-light font-mono" translate="no">
                - ${COMPUTE_CREDITS}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 w-full justify-between">
            <span>Total</span>
            <span className="text-foreground font-mono flex items-center gap-1">
              <InfoTooltip side="top" className="max-w-[250px]">
                This estimate only includes Plan and Compute add-on monthly costs. Other resources
                might incur additional costs in the final invoice.
              </InfoTooltip>
              ${activePrice}
            </span>
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
                  <ComputeBadge
                    infraComputeSize={findInstanceValueByColumn(activeInstance, 'plan')}
                  />
                  <p className="text-xs text-foreground-lighter">
                    Project {activeInstance.position + 1}
                  </p>
                </div>
                <span className="leading-3 text-sm" translate="no">
                  {findInstanceValueByColumn(activeInstance, 'pricing')}
                </span>
              </div>
              <div className="w-full relative">
                {!hasInteractedWithSlider && (
                  <label className="absolute -top-2 left-6 text-xs text-foreground-muted pointer-events-none bg-surface-300 px-1 py-0.5 rounded-md z-10 flex items-center gap-1">
                    Drag to adjust
                  </label>
                )}
                <Slider_Shadcn_
                  onValueChange={(value) => handleUpdateInstance(activeInstance.position, value)}
                  value={findSliderComputeValue(activeInstance)}
                  min={1}
                  key={`${index}-${activeInstance.position}`}
                  max={priceSteps.length}
                  step={1}
                  className={cn(
                    'w-full cursor-grab active:cursor-grabbing',
                    !hasInteractedWithSlider && "[&_[data-slot='slider-thumb']]:animate-pulse"
                  )}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="w-full flex items-center gap-2">
                  <span className="text-lighter text-xs md:text-[13px]">
                    {findInstanceValueByColumn(activeInstance, 'memory')} RAM /{' '}
                    {findInstanceValueByColumn(activeInstance, 'cpu')} CPU / Connections: Direct{' '}
                    {findInstanceValueByColumn(activeInstance, 'directConnections')}, Pooler{' '}
                    {findInstanceValueByColumn(activeInstance, 'poolerConnections')}
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
        <div className="text-right w-full">
          <Button
            size="tiny"
            type="primary"
            icon={<Plus />}
            onClick={() => {
              setActiveInstances([
                ...activeInstances,
                { ...computeInstances[0], position: activeInstances.length },
              ])
            }}
          >
            <span className="text-left">Add Project</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NewComputePricingCalculator
