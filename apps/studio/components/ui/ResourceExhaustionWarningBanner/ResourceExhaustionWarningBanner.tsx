import { AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, cn } from 'ui'
import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'
import { getWarningContent } from './ResourceExhaustionWarningBanner.utils'

export const ResourceExhaustionWarningBanner = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { data: resourceWarnings } = useResourceWarningsQuery()
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

  const title =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.bannerContent[
          hasCriticalWarning ? 'critical' : 'warning'
        ].title
      : warningContent?.title

  const description =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.bannerContent[
          hasCriticalWarning ? 'critical' : 'warning'
        ].description
      : warningContent?.description

  const learnMoreUrl =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.docsUrl
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.docsUrl

  const metric =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.metric
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.metric

  const correctionUrlVariants = {
    undefined: undefined,
    null: '/project/[ref]/settings/[infra-path]',
    disk_space: '/project/[ref]/settings/compute-and-disk',
    read_only: '/project/[ref]/settings/compute-and-disk',
    auth_email_rate_limit: '/project/[ref]/auth/rate-limits',
    auth_restricted_email_sending: '/project/[ref]/auth/smtp',
    default: (metric: string) => `/project/[ref]/settings/[infra-path]#${metric}`,
  }

  const getCorrectionUrl = (metric: string | undefined | null) => {
    const variant = metric === undefined ? 'undefined' : metric === null ? 'null' : metric
    const url =
      correctionUrlVariants[variant as keyof typeof correctionUrlVariants] ||
      correctionUrlVariants.default(metric as string)
    return typeof url === 'function' ? url(metric as string) : url
  }

  const correctionUrl = getCorrectionUrl(metric)
    ?.replace('[ref]', ref ?? 'default')
    ?.replace('[infra-path]', 'infrastructure')

  const buttonText =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.buttonText
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.buttonText

  const hasNoWarnings = activeWarnings.length === 0
  const hasNoWarningContent = warningContent === undefined
  const isUsageOrInfraPage =
    router.pathname.endsWith('/usage') || router.pathname.endsWith('/infrastructure')
  const onUsageOrInfraAndNotInReadOnlyMode =
    isUsageOrInfraPage && !activeWarnings.includes('is_readonly_mode_enabled')
  const onDatabaseSettingsAndInReadOnlyMode =
    router.pathname.endsWith('settings/compute-and-disk') &&
    activeWarnings.includes('is_readonly_mode_enabled')

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
    onDatabaseSettingsAndInReadOnlyMode ||
    !isVisible
  ) {
    return null
  }

  return (
    <Alert_Shadcn_
      variant={isCritical ? 'destructive' : 'warning'}
      className={cn(
        'flex items-center justify-between',
        'border-0 border-r-0 rounded-none [&>svg]:left-6 px-6 [&>svg]:w-[26px] [&>svg]:h-[26px]'
      )}
    >
      <AlertTriangle />
      <div className="">
        <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
      </div>
      <div className="flex items-center gap-x-2">
        {learnMoreUrl !== undefined && (
          <Button asChild type="default" icon={<ExternalLink />}>
            <a href={learnMoreUrl} target="_blank" rel="noreferrer">
              Learn more
            </a>
          </Button>
        )}
        {correctionUrl !== undefined && (
          <Button asChild type="default">
            <Link href={correctionUrl}>{buttonText ?? 'Check'}</Link>
          </Button>
        )}
      </div>
    </Alert_Shadcn_>
  )
}
