'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, ChevronDown, ChevronRight, Copy, FileText } from 'lucide-react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'

import { Button, cn } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import Panel from '~/components/Panel'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import {
  buildProjectionSeries,
  calculatePricingReport,
  calculateRoiSummary,
  decodeInputsFromHash,
  decodeInputsFromSearchParams,
  encodeInputsToHash,
  estimateAuthComparison,
  getDefaultInputs,
} from '~/lib/pricing-calculator'
import type { CalculatorInputs, CalculatorStageId } from '~/lib/pricing-calculator'

import CalloutCard from './components/CalloutCard'
import GrowthChart from './components/GrowthChart'
import ReportView from './components/ReportView'
import { ProductKey } from './components/ProductToggleCard'
import StageProductSelection from './stages/StageProductSelection'
import Stage1ProjectBasics from './stages/Stage1ProjectBasics'
import Stage2UsageEstimation from './stages/Stage2UsageEstimation'
import Stage3Growth from './stages/Stage3Growth'
import Stage4TimeAllocation from './stages/Stage4TimeAllocation'
import SummaryPanel from './summary/SummaryPanel'

export default function PricingCalculator() {
  const sendTelemetryEvent = useSendTelemetryEvent()

  const [activeStage, setActiveStage] = useState<CalculatorStageId>('products')
  const [inputs, setInputs] = useState<CalculatorInputs>(() => getDefaultInputs())
  const [linkCopied, setLinkCopied] = useState(false)
  const [summaryCopied, setSummaryCopied] = useState(false)

  // Product selection as a Set for easy toggling
  const selectedProducts = new Set(inputs.selectedProducts)

  const handleToggleProduct = (key: ProductKey) => {
    const next = new Set(selectedProducts)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setInputs({ ...inputs, selectedProducts: Array.from(next) as typeof inputs.selectedProducts })
    sendTelemetryEvent({
      action: 'www_pricing_calculator_product_toggled',
      properties: { product: key, selected: !selectedProducts.has(key) },
    })
  }

  // Hydrate state from URL (shareable links)
  // Supports both hash-based (new) and query param (legacy) formats
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove leading #
    if (hash) {
      // New hash-based format
      const decoded = decodeInputsFromHash(hash, getDefaultInputs())
      setInputs(decoded.inputs)
    } else if (window.location.search) {
      // Legacy query param format (for backwards compatibility)
      const params = new URLSearchParams(window.location.search)
      const decoded = decodeInputsFromSearchParams(params, getDefaultInputs())
      setInputs(decoded.inputs)
    }
  }, [])

  // Keep URL in sync as inputs change (shallow replace)
  useEffect(() => {
    const { pathname } = window.location
    const hash = encodeInputsToHash(inputs)
    const newAsPath = pathname + '#' + hash
    history.replaceState({ url: newAsPath }, '', newAsPath)
  }, [inputs])

  const pricingReport = useMemo(() => calculatePricingReport(inputs), [inputs])
  const roiSummary = useMemo(
    () =>
      calculateRoiSummary({
        teamSize: inputs.teamSize,
        hourlyCostUsd: inputs.hourlyCostUsd,
        timeAllocationOverrides: inputs.timeAllocationOverrides,
      }),
    [inputs.teamSize, inputs.hourlyCostUsd, inputs.timeAllocationOverrides]
  )

  const authComparison = useMemo(
    () =>
      estimateAuthComparison({
        mau: inputs.mau,
        databaseSizeGb: inputs.databaseSizeGb,
        storageSizeGb: inputs.storageSizeGb,
        egressGb: inputs.egressGb,
        appType: inputs.appType,
      }),
    [inputs.mau, inputs.databaseSizeGb, inputs.storageSizeGb, inputs.egressGb, inputs.appType]
  )
  const projectionSeries = useMemo(() => buildProjectionSeries(inputs), [inputs])

  const copyShareableLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      sendTelemetryEvent({
        action: 'www_pricing_calculator_share_link_copied',
        properties: { stage: activeStage },
      })
    } catch {
      // Fallback: do nothing (prototype)
    }
  }

  const generateSummaryText = () => {
    const plan = pricingReport.recommended.plan
    const planCost = pricingReport.estimates[plan].totalMonthlyUsd
    const appTypeLabels: Record<string, string> = {
      content: 'Content/Marketing',
      ecommerce: 'E-commerce',
      saas: 'SaaS/Dashboard',
      social: 'Social/UGC',
      collaboration: 'Collaboration',
      realtime: 'Realtime/Gaming',
    }

    const formatUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

    const lines = [
      'Supabase Pricing Estimate',
      '-------------------------',
      `App type: ${appTypeLabels[inputs.appType] || inputs.appType}`,
      `MAU: ${inputs.mau.toLocaleString()} | Database: ${inputs.databaseSizeGb} GB | Storage: ${inputs.storageSizeGb} GB`,
      '',
      `Recommended: ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan at ${formatUsd(planCost)}/mo`,
      '',
      'Competitor comparison (estimated):',
    ]

    // Add competitor comparisons
    const firebase = authComparison.firebaseMonthlyUsd
    const auth0 = authComparison.auth0MonthlyUsd
    const clerk = authComparison.clerkMonthlyUsd

    if (firebase > planCost) {
      lines.push(`  vs Firebase: Save ${formatUsd(firebase - planCost)}/mo`)
    }
    if (auth0 && auth0 > planCost) {
      lines.push(`  vs Auth0: Save ${formatUsd(auth0 - planCost)}/mo`)
    }
    if (clerk && clerk > planCost) {
      lines.push(`  vs Clerk: Save ${formatUsd(clerk - planCost)}/mo`)
    }

    lines.push('')
    lines.push(`Full calculator: ${window.location.href}`)

    return lines.join('\n')
  }

  const copySummary = async () => {
    try {
      const summary = generateSummaryText()
      await navigator.clipboard.writeText(summary)
      setSummaryCopied(true)
      setTimeout(() => setSummaryCopied(false), 2000)
      sendTelemetryEvent({
        action: 'www_pricing_calculator_summary_copied',
        properties: { recommendedPlan: pricingReport.recommended.plan },
      })
    } catch {
      // Fallback: do nothing
    }
  }

  const goToStage = (stage: CalculatorStageId) => {
    setActiveStage(stage)
    sendTelemetryEvent({
      action: 'www_pricing_calculator_stage_changed',
      properties: { stage },
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-2xl">Core calculator</h2>
                <p className="text-foreground-lighter text-sm">
                  Costs update as you adjust inputs. Use the share link to send your estimate to your team.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type={linkCopied ? 'primary' : 'default'}
                  size="tiny"
                  icon={linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  onClick={copyShareableLink}
                >
                  {linkCopied ? 'Copied!' : 'Copy link'}
                </Button>
                <Button asChild type="outline" size="tiny" iconRight={<ArrowUpRight className="w-4 h-4" />}>
                  <Link href="/contact/sales" target="_blank">
                    Talk to sales
                  </Link>
                </Button>
              </div>
            </div>
          </Panel>

          <StagePanel
            id="products"
            title="Step 1: Select products"
            description="Choose the Supabase products you want to include in your estimate."
            active={activeStage === 'products'}
            onActivate={() => goToStage('products')}
          >
            <StageProductSelection
              selectedProducts={selectedProducts}
              onToggleProduct={handleToggleProduct}
            />

            <div className="mt-4 flex justify-end">
              <Button
                type="primary"
                iconRight={<ChevronRight className="w-4 h-4" />}
                onClick={() => goToStage('stage1')}
                disabled={selectedProducts.size === 0}
              >
                Continue to project basics
              </Button>
            </div>
          </StagePanel>

          <StagePanel
            id="stage1"
            title="Step 2: Project basics"
            description="Capture foundational information that shapes pricing and value calculations."
            active={activeStage === 'stage1'}
            onActivate={() => goToStage('stage1')}
          >
            <Stage1ProjectBasics inputs={inputs} onChange={setInputs} />

            <div className="mt-4 flex justify-end">
              <Button type="primary" iconRight={<ChevronRight className="w-4 h-4" />} onClick={() => goToStage('stage2')}>
                Continue to usage estimation
              </Button>
            </div>
          </StagePanel>

          <StagePanel
            id="stage2"
            title="Step 3: Usage estimation"
            description="Configure the usage dimensions for your selected products."
            active={activeStage === 'stage2'}
            onActivate={() => goToStage('stage2')}
          >
            <Stage2UsageEstimation
              inputs={inputs}
              onChange={setInputs}
              authComparison={authComparison}
              freePlanEgressLimitGb={5}
              proEgressIncludedGb={250}
            />
            <div className="mt-4 flex justify-end">
              <Button type="primary" iconRight={<ChevronRight className="w-4 h-4" />} onClick={() => goToStage('stage3')}>
                Continue to growth projections
              </Button>
            </div>
          </StagePanel>

          <StagePanel
            id="stage3"
            title="Step 4: Growth projections"
            description="Model future costs based on expected growth."
            active={activeStage === 'stage3'}
            onActivate={() => goToStage('stage3')}
          >
            <Stage3Growth inputs={inputs} onChange={setInputs} />
            <div className="mt-6">
              <GrowthChart
                title="Projected costs over time"
                subtitle="Supabase vs common alternatives (estimated)"
                series={projectionSeries}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="primary" iconRight={<ChevronRight className="w-4 h-4" />} onClick={() => goToStage('stage4')}>
                Continue to time allocation
              </Button>
            </div>
          </StagePanel>

          <StagePanel
            id="stage4"
            title="Step 5: Team and organization (optional)"
            description="Model your team to calculate productivity benefits and ROI."
            active={activeStage === 'stage4'}
            onActivate={() => goToStage('stage4')}
          >
            <Stage4TimeAllocation inputs={inputs} onChange={setInputs} />
            <CalloutCard
              title="How this is used"
              body="These values power the ROI calculation in your final report. Leave fields blank to use our estimates based on your team size, or enter your actual time spent for more accurate results."
              className="mt-4"
            />
          </StagePanel>

          <Panel outerClassName="w-full" innerClassName="p-5 md:p-6 flex flex-col gap-2" style={{ scrollMarginTop: 120 }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-foreground text-2xl">Final report</h2>
                <p className="text-foreground-lighter text-sm">
                  A shareable, detailed breakdown combining pricing and ROI. Estimates are transparent and traceable.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type={linkCopied ? 'primary' : 'default'}
                  size="tiny"
                  icon={linkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  onClick={copyShareableLink}
                >
                  {linkCopied ? 'Copied!' : 'Copy link'}
                </Button>
                <Button
                  type={summaryCopied ? 'primary' : 'default'}
                  size="tiny"
                  icon={summaryCopied ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  onClick={copySummary}
                >
                  {summaryCopied ? 'Copied!' : 'Copy summary'}
                </Button>
                <InfoTooltip side="top" className="max-w-[260px]">
                  Competitor pricing is sourced from official pricing pages (see report for sources and as-of dates).
                </InfoTooltip>
              </div>
            </div>
            <ReportView
              pricingReport={pricingReport}
              roiSummary={roiSummary}
              authComparison={authComparison}
              projectionSeries={projectionSeries}
              onViewed={() =>
                sendTelemetryEvent({
                  action: 'www_pricing_calculator_report_viewed',
                  properties: { recommendedPlan: pricingReport.recommended.plan },
                })
              }
            />
          </Panel>
        </div>

        <div className="lg:col-span-4">
          <SummaryPanel
            className="lg:sticky lg:top-20"
            pricingReport={pricingReport}
            roiSummary={roiSummary}
            onTalkToSales={() =>
              sendTelemetryEvent({
                action: 'www_pricing_calculator_talk_to_sales_clicked',
                properties: { recommendedPlan: pricingReport.recommended.plan },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

// comparison label helper removed in multi-compare mode

const stageSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
}

function StagePanel({
  id,
  title,
  description,
  active,
  onActivate,
  children,
}: {
  id: CalculatorStageId
  title: string
  description: string
  active: boolean
  onActivate: () => void
  children: React.ReactNode
}) {
  return (
    <LazyMotion features={domAnimation}>
      <Panel
        outerClassName="w-full"
        innerClassName={cn('p-5 md:p-6', !active && 'cursor-pointer')}
      >
        <button
          type="button"
          className="w-full text-left"
          onClick={() => !active && onActivate()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground text-lg">{title}</h3>
              <p className="text-foreground-lighter text-sm">{description}</p>
            </div>
            <m.div
              className="text-foreground-lighter mt-1 flex items-center gap-1"
              initial={false}
              animate={{ rotate: active ? 180 : 0 }}
              transition={stageSpring}
            >
              <ChevronDown className="w-4 h-4" />
            </m.div>
          </div>
          <div className={cn('text-foreground-lighter text-xs mt-1', active ? 'opacity-0' : 'opacity-100')}>
            Click to edit
          </div>
        </button>
        {active && <div className="mt-6">{children}</div>}
      </Panel>
    </LazyMotion>
  )
}

