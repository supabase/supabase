import pricingAddOn from '~/data/PricingAddOnTable.json'
import { Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState, type PointerEvent, type ReactNode } from 'react'
import { plans as allPlans } from 'shared-data/plans'
import { Button, cn, Slider, ToggleGroup, ToggleGroupItem } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

const STANDALONE_PLANS = allPlans
  .filter((plan) => plan.planId === 'pro' || plan.planId === 'team')
  .map((plan) => ({ name: plan.name, price: plan.priceMonthly as number }))

const TICKS_PER_STEP = 4

const findInstanceValueByColumn = (instance: any, column: string) =>
  instance.columns?.find((col: any) => col.key === column)?.value

const formatUsd = (amount: number) => `$${amount.toLocaleString('en-US')}`

const parsePrice = (price: string) => {
  const n = parseInt(price?.toString().replace('$', '').replace(',', ''), 10)
  return Number.isNaN(n) ? 0 : n
}

interface ComputePricingCalculatorProps {
  activePlan?: {
    name: string
    price: number
  }
  disableInteractivity?: boolean
}

const ComputePricingCalculator = ({
  activePlan,
  disableInteractivity,
}: ComputePricingCalculatorProps) => {
  // When activePlan is not provided, manage plan selection internally
  const [internalPlan, setInternalPlan] = useState(STANDALONE_PLANS[0])
  const effectivePlan = activePlan ?? internalPlan
  const isStandalone = activePlan === undefined

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
  const [activePrice, setActivePrice] = useState(
    effectivePlan.price + priceSteps[0] - COMPUTE_CREDITS
  )

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
    return activeInstances.reduce(
      (acc, activeInstance: any) =>
        acc + parsePrice(findInstanceValueByColumn(activeInstance, 'pricing')),
      price
    )
  }

  useEffect(() => {
    const computeAggregate = activeInstances.reduce(
      (acc, activeInstance: any) =>
        acc + parsePrice(findInstanceValueByColumn(activeInstance, 'pricing')),
      0
    )
    setActivePrice(Math.max(0, computeAggregate + effectivePlan.price - COMPUTE_CREDITS))
  }, [activeInstances, effectivePlan])

  const removeInstance = (position: number) => {
    const newArray = activeInstances
      .filter((activeInstance) => activeInstance.position !== position)
      .map((instance, index) => ({ ...instance, position: index }))

    setActiveInstances(newArray)
  }

  const [stepPreview, setStepPreview] = useState<{ position: number; step: number } | null>(null)

  const handleStepPreview = (position: number) => (step: number | null) =>
    setStepPreview(step === null ? null : { position, step })

  const getDisplayedInstance = (activeInstance: any) =>
    stepPreview !== null && stepPreview.position === activeInstance.position
      ? computeInstances[stepPreview.step]
      : activeInstance

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
        {isStandalone && (
          <ToggleGroup
            type="single"
            value={internalPlan.name}
            onValueChange={(value) => {
              const selected = STANDALONE_PLANS.find((p) => p.name === value)
              if (selected) setInternalPlan(selected)
            }}
            className="grid grid-cols-2 gap-1 w-full bg-surface-200 rounded-md"
          >
            {STANDALONE_PLANS.map((plan) => (
              <ToggleGroupItem
                key={plan.name}
                value={plan.name}
                className={cn(
                  'w-full h-6 border-transparent',
                  internalPlan.name === plan.name
                    ? 'bg-surface-200 text-foreground data-[state=on]:bg-surface-400 data-[state=on]:text-foreground'
                    : 'hover:bg-surface-200'
                )}
              >
                {plan.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        <div>
          <p className="text-foreground-light text-xs mb-2">Monthly estimate:</p>
          <div className="flex flex-col gap-2 text-lighter text-right leading-4 w-full border-b pb-2 mb-2 tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Plan subscription</span>
              <span className="text-light" translate="no">
                {formatUsd(effectivePlan.price)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Total Compute</span>
              <span className="text-light" translate="no">
                $<RollingNumber value={calculateComputeAggregate(0)} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Compute Credits</span>
              <span className="text-light" translate="no">
                −{formatUsd(COMPUTE_CREDITS)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 w-full justify-between font-medium">
            <span className="flex items-center gap-1">
              Total
              <InfoTooltip side="top" className="max-w-[250px]" label="About this estimate">
                This estimate only includes Plan and Compute add-on monthly costs. Other resources
                might incur additional costs in the final invoice.
              </InfoTooltip>
            </span>
            <span role="status" className="text-foreground tabular-nums" translate="no">
              $<RollingNumber value={activePrice} />
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 col-span-3 items-start flex-1 w-full lg:w-auto lg:pl-4">
        <div
          className={cn(
            'w-full flex flex-col items-start gap-y-2',
            activeInstances.length === 1 && 'border-none'
          )}
        >
          {activeInstances.map((activeInstance, index) => (
            <div
              className="group w-full flex flex-col gap-3 p-3 bg-surface-200 rounded-md border"
              key={`instance-${index}`}
            >
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-foreground-lighter">
                    Project {activeInstance.position + 1}
                  </p>
                  <ComputeBadge
                    className="border-0 inset-ring inset-ring-current/20"
                    infraComputeSize={findInstanceValueByColumn(
                      getDisplayedInstance(activeInstance),
                      'plan'
                    )}
                  >
                    <RollingValue
                      value={findInstanceValueByColumn(
                        getDisplayedInstance(activeInstance),
                        'plan'
                      )}
                    >
                      {findInstanceValueByColumn(getDisplayedInstance(activeInstance), 'plan')}
                    </RollingValue>
                  </ComputeBadge>
                </div>
                <span className="leading-3 text-sm tabular-nums" translate="no">
                  $
                  <RollingNumber
                    value={parsePrice(
                      findInstanceValueByColumn(getDisplayedInstance(activeInstance), 'pricing')
                    )}
                  />
                </span>
              </div>
              <SliderSteps
                stepCount={computeInstances.length}
                onStepPreview={handleStepPreview(activeInstance.position)}
                activeStep={findSliderComputeValue(activeInstance)[0] - 1}
              >
                <Slider
                  onValueChange={(value) => handleUpdateInstance(activeInstance.position, value)}
                  value={findSliderComputeValue(activeInstance)}
                  min={1}
                  key={`${index}-${activeInstance.position}`}
                  max={priceSteps.length}
                  step={1}
                  className={cn(
                    'w-full min-h-12 cursor-pointer',
                    "**:data-[slot='slider-track']:bg-transparent **:data-[slot='slider-range']:bg-transparent",
                    "**:data-[slot='slider-thumb']:slider-split-thumb",
                    "**:data-[slot='slider-thumb']:relative **:data-[slot='slider-thumb']:before:absolute **:data-[slot='slider-thumb']:before:-inset-y-2 **:data-[slot='slider-thumb']:before:-inset-x-3"
                  )}
                />
              </SliderSteps>
              <div className="flex items-center justify-between text-sm">
                <div className="w-full flex items-center gap-2">
                  <span className="text-lighter text-xs md:text-[13px]">
                    {findInstanceValueByColumn(getDisplayedInstance(activeInstance), 'memory')} RAM
                    / {findInstanceValueByColumn(getDisplayedInstance(activeInstance), 'cpu')} /
                    Connections: Direct{' '}
                    {findInstanceValueByColumn(
                      getDisplayedInstance(activeInstance),
                      'directConnections'
                    )}
                    , Pooler{' '}
                    {findInstanceValueByColumn(
                      getDisplayedInstance(activeInstance),
                      'poolerConnections'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeInstances.length > 1 && (
                    <button
                      tabIndex={0}
                      aria-label="Remove item"
                      title="Remove item"
                      className="p-1 text-lighter hover:text-foreground rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
            variant="primary"
            icon={<Plus />}
            onClick={() => {
              if (disableInteractivity) return
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

const SliderSteps = ({
  stepCount,
  activeStep,
  onStepPreview,
  children,
}: {
  stepCount: number
  activeStep: number
  onStepPreview: (step: number | null) => void
  children: ReactNode
}) => {
  const [hoveredTick, setHoveredTick] = useState<number | null>(null)
  const [isPointerFocus, setIsPointerFocus] = useState(false)
  const lastStep = stepCount - 1
  const tickCount = lastStep * TICKS_PER_STEP + 1
  const hoveredStep = hoveredTick === null ? null : Math.round(hoveredTick / TICKS_PER_STEP)
  const previewStep = hoveredStep === activeStep ? null : hoveredStep
  const [sweep, setSweep] = useState({ from: activeStep, to: activeStep, id: 0 })

  if (sweep.to !== activeStep) {
    setSweep({ from: sweep.to, to: activeStep, id: sweep.id + 1 })
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    const tick = Math.round(ratio * (tickCount - 1))
    const step = Math.round(tick / TICKS_PER_STEP)
    setHoveredTick(tick)
    onStepPreview(step === activeStep ? null : step)
  }

  const handlePointerLeave = () => {
    setHoveredTick(null)
    onStepPreview(null)
  }

  const handlePointerDown = () => setIsPointerFocus(true)
  const handleBlur = () => setIsPointerFocus(false)
  const handleKeyDown = () => {
    setIsPointerFocus(false)
    setHoveredTick(null)
    onStepPreview(null)
  }

  return (
    <div
      // radix focuses the thumb in code on press, so chrome can match :focus-visible after a click
      className={cn(
        'relative w-full',
        isPointerFocus &&
          "**:data-[slot='slider-thumb']:focus-visible:ring-0 **:data-[slot='slider-thumb']:focus-visible:ring-offset-0"
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-x-0.75">
        {Array.from({ length: tickCount }, (_, tick) => {
          const step = tick / TICKS_PER_STEP
          const isStep = Number.isInteger(step)
          const hoverDistance = hoveredTick === null ? Infinity : Math.abs(tick - hoveredTick)
          const sweepProgress = (step - sweep.from) / (sweep.to - sweep.from)
          const isSwept = sweepProgress > 0 && sweepProgress < 1
          const activeDistance = Math.abs(tick - activeStep * TICKS_PER_STEP)
          const nearest = Math.min(hoverDistance, activeDistance)
          const growth = nearest <= 3 && step !== activeStep ? 1 + (4 - nearest) * 0.2 : 1

          return (
            <span
              // a new key restarts the pass animation on every selection change
              key={isSwept ? `${tick}-${sweep.id}` : tick}
              className={cn(
                'absolute top-1/2 -translate-1/2',
                'motion-safe:transition-[scale,height,opacity] motion-safe:duration-150 motion-safe:ease-out',
                isStep ? 'w-1 split-line-sm text-foreground' : 'h-3 w-px bg-foreground',
                isSwept &&
                  (isStep ? 'motion-safe:animate-step-pass' : 'motion-safe:animate-tick-pass')
              )}
              style={{
                animationDelay: isSwept ? `${sweepProgress * 150}ms` : undefined,
                left: `${(step / lastStep) * 100}%`,
                opacity:
                  step === activeStep
                    ? 0
                    : step === previewStep
                      ? 1
                      : Math.max(
                          isStep ? 0.3 : 0.12,
                          1 - hoverDistance * 0.2,
                          1 - activeDistance * 0.2
                        ),
                // steps grow in height, not scale, so the gap keeps its size
                height: isStep ? `${Math.min(26 * growth, 32)}px` : undefined,
                scale: isStep ? undefined : `1 ${growth}`,
              }}
            />
          )
        })}
      </div>
      {children}
    </div>
  )
}

const RollingValue = ({
  value,
  trend = 1,
  delay = 0,
  children,
}: {
  value: string
  trend?: number
  delay?: number
  children: ReactNode
}) => {
  const [width, setWidth] = useState<number>()
  const measureRef = useCallback((node: HTMLSpanElement | null) => {
    if (node) setWidth(node.offsetWidth)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <span
        className="relative inline-grid overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={trend}>
          <motion.span
            key={value}
            ref={measureRef}
            custom={trend}
            variants={{
              enter: (rollTrend: number) => ({ y: `${rollTrend * 100}%`, opacity: 0 }),
              center: { y: 0, opacity: 1 },
              exit: (rollTrend: number) => ({ y: `${rollTrend * -100}%`, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', duration: 0.3, bounce: 0, delay }}
            className="inline-flex w-max"
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </span>
    </MotionConfig>
  )
}

const RollingNumber = ({ value }: { value: number }) => {
  const shouldReduceMotion = useReducedMotion()
  const [roll, setRoll] = useState({ value, trend: 1 })
  if (roll.value !== value) setRoll({ value, trend: value < roll.value ? -1 : 1 })
  const text = value.toLocaleString('en-US')

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        <AnimatePresence initial={false}>
          {text.split('').map((char, index, chars) => (
            // key by place from the right, so unchanged trailing digits keep their slot and do not roll
            <motion.span
              key={chars.length - index}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.3, bounce: 0 }
              }
              className="inline-flex overflow-hidden"
            >
              <RollingValue value={char} trend={roll.trend} delay={index * 0.03}>
                {char}
              </RollingValue>
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </>
  )
}

export default ComputePricingCalculator
