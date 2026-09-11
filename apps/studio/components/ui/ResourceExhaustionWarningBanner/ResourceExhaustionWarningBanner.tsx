import { useParams } from 'common'
import { AlertTriangle, BookOpen, ChartLine, ChevronDown, Sparkles, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { COMPUTE_DISK } from 'shared-data'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'
import {
  applyResourceList,
  getResourceWarningAiPrompt,
  getResourceWarningCorrectionUrl,
  getTroubleshootItems,
  getWarningContent,
  isComputeUpgradeWarning,
  type TroubleshootItem,
} from './ResourceExhaustionWarningBanner.utils'
import { mapComputeSizeNameToAddonVariantId } from '@/components/interfaces/DiskManagement/DiskManagement.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useResourceWarningsQuery } from '@/data/usage/resource-warnings-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useShowDiskIOBurstBalanceChart } from '@/hooks/misc/useShowDiskIOBurstBalanceChart'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

type LinkedTroubleshootItem = Extract<TroubleshootItem, { kind: 'metrics' | 'docs' }>

const TroubleshootMenuItem = ({
  item,
  onTroubleshootClick,
  onAskAI,
}: {
  item: TroubleshootItem
  onTroubleshootClick: (item: LinkedTroubleshootItem) => void
  onAskAI: () => void
}) => {
  if (item.kind === 'ai') {
    return (
      <DropdownMenuItem className="flex items-center gap-x-2 cursor-pointer" onClick={onAskAI}>
        <Sparkles size={14} />
        {item.menuLabel}
      </DropdownMenuItem>
    )
  }
  if (item.kind === 'metrics') {
    return (
      <DropdownMenuItem asChild onClick={() => onTroubleshootClick(item)}>
        <Link href={item.href} className="flex items-center gap-x-2 cursor-pointer">
          <ChartLine size={14} />
          {item.menuLabel}
        </Link>
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuItem asChild onClick={() => onTroubleshootClick(item)}>
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-x-2 cursor-pointer"
      >
        <BookOpen size={14} />
        {item.menuLabel}
      </a>
    </DropdownMenuItem>
  )
}

export const ResourceExhaustionWarningBanner = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { data: organization, isLoading: isOrgLoading } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const diskIoBaselineLabel = (() => {
    const variant = mapComputeSizeNameToAddonVariantId(project?.infra_compute_size)
    const baseline = COMPUTE_DISK[variant]?.baselineThroughputMBps
    return typeof baseline === 'number' ? `${baseline} MB/s` : 'its baseline'
  })()
  const applyDiskIoBaseline = (text?: string) =>
    text ? text.replace(/\{baseline\}/g, diskIoBaselineLabel) : text
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const track = useTrack()
  const showBurstBalanceChart = useShowDiskIOBurstBalanceChart()
  const { data: resourceWarnings } = useResourceWarningsQuery({ ref: ref })
  // [Joshen Cleanup] JFYI this client side filtering can be cleaned up once BE changes are live which will only return the warnings based on the provided ref
  const projectResourceWarnings = (resourceWarnings ?? [])?.find(
    (warning) => warning.project === ref
  )

  // [Joshen] Read only takes higher precedence over multiple resource warnings
  const activeWarnings =
    projectResourceWarnings !== undefined
      ? projectResourceWarnings.is_readonly_mode_enabled
        ? ['is_readonly_mode_enabled']
        : Object.keys(projectResourceWarnings).filter(
            (property) =>
              property !== 'project' &&
              property !== 'is_readonly_mode_enabled' &&
              projectResourceWarnings[property as keyof typeof projectResourceWarnings] !== null
          )
      : []

  const hasCriticalWarning =
    projectResourceWarnings !== undefined
      ? activeWarnings.some(
          (x) => projectResourceWarnings[x as keyof typeof projectResourceWarnings] === 'critical'
        )
      : false
  const isCritical = activeWarnings.includes('is_readonly_mode_enabled') || hasCriticalWarning

  const warningContent =
    projectResourceWarnings !== undefined
      ? getWarningContent(projectResourceWarnings, activeWarnings[0], 'bannerContent')
      : undefined

  const title = applyDiskIoBaseline(
    applyResourceList(
      activeWarnings.length > 1
        ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.bannerContent[
            hasCriticalWarning ? 'critical' : 'warning'
          ].title
        : warningContent?.title,
      activeWarnings
    )
  )

  const description = applyDiskIoBaseline(
    applyResourceList(
      activeWarnings.length > 1
        ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.bannerContent[
            hasCriticalWarning ? 'critical' : 'warning'
          ].description
        : warningContent?.description,
      activeWarnings
    )
  )

  const metric =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.metric
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.metric

  const isFreePlan = organization?.plan?.id === 'free'

  // True for a single compute warning, or when all active warnings are compute-related
  const isComputeUpgradeMetric = isComputeUpgradeWarning(metric, activeWarnings)

  const correctionUrl = getResourceWarningCorrectionUrl({
    metric,
    activeWarnings,
    projectRef: ref,
    isFreePlan,
    organizationSlug: organization?.slug,
  })

  const buttonText = (() => {
    if (isComputeUpgradeMetric) return 'Upgrade compute'
    return activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.buttonText
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.buttonText
  })()

  const aiPrompt = getResourceWarningAiPrompt(activeWarnings)
  const chartIdOverrides = showBurstBalanceChart
    ? { disk_io_exhaustion: 'disk-io-burst-balance' }
    : {}
  const troubleshootItems = getTroubleshootItems({
    activeWarnings,
    projectRef: ref ?? 'default',
    aiPrompt,
    chartIdOverrides,
  })
  const soleTroubleshootItem = troubleshootItems.length === 1 ? troubleshootItems[0] : undefined

  const handleAskAI = () => {
    track('resource_exhaustion_banner_ai_assistant_clicked', {
      warningTypes: activeWarnings,
    })
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({ initialInput: aiPrompt })
  }

  const handleTroubleshootClick = (item: LinkedTroubleshootItem) => {
    track('resource_exhaustion_banner_troubleshoot_clicked', {
      troubleshootAction: item.kind,
      warningType: item.warningType,
      warningTypes: activeWarnings,
      destination: item.href,
    })
  }

  const hasNoWarnings = activeWarnings.length === 0
  const hasNoWarningContent =
    warningContent === undefined || (!warningContent?.title && !warningContent?.description)
  const isUsageOrInfraPage =
    router.pathname.endsWith('/usage') || router.pathname.endsWith('/infrastructure')
  // Compute warnings now link to infrastructure, so they should remain visible on usage.
  const onUsageOrInfraAndNotInReadOnlyMode =
    isUsageOrInfraPage &&
    !activeWarnings.includes('is_readonly_mode_enabled') &&
    !isComputeUpgradeMetric
  // Suppress when already on the target page (no-op CTA). Paid-plan compute warnings link to
  // infrastructure; free-plan links to billing instead, so we keep the banner visible for them.
  const shouldSuppressOnInfrastructurePage =
    router.pathname.endsWith('settings/infrastructure') &&
    (activeWarnings.includes('is_readonly_mode_enabled') || (isComputeUpgradeMetric && !isFreePlan))

  // these take precedence over each other, so there's only one active warning to check
  const activeWarning =
    RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
  const restrictToRoutes = activeWarning?.restrictToRoutes

  const isVisible =
    restrictToRoutes === undefined ||
    restrictToRoutes.some((route: string) => {
      // check for exact match with /project/[ref] (project home) first
      // doing this let's us avoid checking with regex, keeping it simple
      if (route === '/project/[ref]') {
        const isExactMatch = router.pathname === '/project/[ref]'
        return isExactMatch
      }

      // For other routes, use the original startsWith logic
      const isMatch = router.pathname.startsWith(route)
      return isMatch
    })

  if (
    hasNoWarnings ||
    hasNoWarningContent ||
    onUsageOrInfraAndNotInReadOnlyMode ||
    shouldSuppressOnInfrastructurePage ||
    !isVisible
  ) {
    return null
  }

  return (
    <Alert
      variant={isCritical ? 'destructive' : 'warning'}
      className={cn(
        'flex items-center justify-between',
        'border-0 border-r-0 rounded-none [&>svg]:left-6 px-6 [&>svg]:w-[26px] [&>svg]:h-[26px]'
      )}
    >
      <AlertTriangle />
      <div className="">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
      <div className="flex items-center gap-x-2">
        {troubleshootItems.length >= 2 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={<Wrench size={14} />} iconRight={<ChevronDown size={14} />}>
                Troubleshoot
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {troubleshootItems.map((item) => (
                <TroubleshootMenuItem
                  key={item.kind === 'ai' ? 'ai' : `${item.kind}-${item.warningType}`}
                  item={item}
                  onTroubleshootClick={handleTroubleshootClick}
                  onAskAI={handleAskAI}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {soleTroubleshootItem?.kind === 'metrics' && (
          <Button
            asChild
            icon={<ChartLine size={14} />}
            onClick={() => handleTroubleshootClick(soleTroubleshootItem)}
          >
            <Link href={soleTroubleshootItem.href}>{soleTroubleshootItem.buttonLabel}</Link>
          </Button>
        )}
        {soleTroubleshootItem?.kind === 'docs' && (
          <Button
            asChild
            icon={<BookOpen size={14} />}
            onClick={() => handleTroubleshootClick(soleTroubleshootItem)}
          >
            <a href={soleTroubleshootItem.href} target="_blank" rel="noreferrer">
              {soleTroubleshootItem.buttonLabel}
            </a>
          </Button>
        )}
        {soleTroubleshootItem?.kind === 'ai' && (
          <Button onClick={handleAskAI}>{soleTroubleshootItem.buttonLabel}</Button>
        )}
        {correctionUrl !== undefined && (
          <Button
            asChild
            variant="primary"
            disabled={isComputeUpgradeMetric && isOrgLoading}
            onClick={() =>
              track('resource_exhaustion_banner_upgrade_clicked', {
                warningTypes: activeWarnings,
                destination: correctionUrl,
              })
            }
          >
            <Link href={correctionUrl}>{buttonText ?? 'Check'}</Link>
          </Button>
        )}
      </div>
    </Alert>
  )
}
