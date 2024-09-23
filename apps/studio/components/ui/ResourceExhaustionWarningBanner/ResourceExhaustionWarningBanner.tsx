import { AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, cn } from 'ui'
import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'
import { getWarningContent } from './ResourceExhaustionWarningBanner.utils'

const ResourceExhaustionWarningBanner = () => {
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

  const correctionUrl = (
    metric === undefined
      ? undefined
      : metric === null
        ? '/project/[ref]/settings/[infra-path]'
        : metric === 'disk_space' || metric === 'read_only'
          ? '/project/[ref]/settings/database'
          : metric === 'auth_email_rate_limit'
            ? '/project/[ref]/settings/auth'
            : metric === 'auth_restricted_email_sending'
              ? `/project/[ref]/settings/auth`
              : `/project/[ref]/settings/[infra-path]#${metric}`
  )
    ?.replace('[ref]', ref ?? 'default')
    ?.replace('[infra-path]', 'infrastructure')

  const buttonText =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.buttonText
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.buttonText

  // Don't show banner if no warnings, or on usage/infra page
  if (
    activeWarnings.length === 0 ||
    warningContent === undefined ||
    ((router.pathname.endsWith('/usage') || router.pathname.endsWith('/infrastructure')) &&
      !activeWarnings.includes('is_readonly_mode_enabled')) ||
    (activeWarnings.includes('is_readonly_mode_enabled') &&
      router.pathname.endsWith('settings/database'))
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

export default ResourceExhaustionWarningBanner
