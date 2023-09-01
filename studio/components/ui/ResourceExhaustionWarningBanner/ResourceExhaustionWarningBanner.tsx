import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconExternalLink,
} from 'ui'

import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganization } from 'hooks'
import { RESOURCE_WARNING_MESSAGES } from './ResourceExhaustionWarningBanner.constants'

const ResourceExhaustionWarningBanner = () => {
  const { ref } = useParams()
  const router = useRouter()
  const organization = useSelectedOrganization()
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const projectResourceWarnings = (resourceWarnings ?? [])?.find(
    (warning) => warning.project === ref
  )

  const isOrgBilling = !!organization?.subscription_id

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

  const getContent = (metric: string) => {
    if (projectResourceWarnings === undefined) return undefined
    if (metric === 'is_readonly_mode_enabled') {
      return RESOURCE_WARNING_MESSAGES.is_readonly_mode_enabled.content.warning
    }
    const severity = projectResourceWarnings[metric as keyof typeof projectResourceWarnings]
    if (typeof severity !== 'string') return undefined
    return RESOURCE_WARNING_MESSAGES[metric as keyof typeof RESOURCE_WARNING_MESSAGES].content[
      severity as 'warning' | 'critical'
    ]
  }

  const title =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.content[
          hasCriticalWarning ? 'critical' : 'warning'
        ].title
      : getContent(activeWarnings[0])?.title
  const description =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.content[
          hasCriticalWarning ? 'critical' : 'warning'
        ].description
      : getContent(activeWarnings[0])?.description
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
      : metric === 'disk_space'
      ? '/project/[ref]/settings/database'
      : `/project/[ref]/settings/[infra-path]#${metric}`
  )
    ?.replace('[ref]', ref ?? 'default')
    ?.replace('[infra-path]', isOrgBilling ? 'infrastructure' : 'billing/usage')

  const buttonText =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.buttonText
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.buttonText

  // Don't show banner if no warnings, or on usage/infra page
  if (
    activeWarnings.length === 0 ||
    ((router.pathname.endsWith('/usage') || router.pathname.endsWith('/infrastructure')) &&
      !activeWarnings.includes('is_readonly_mode_enabled'))
  )
    return null

  return (
    <Alert_Shadcn_
      variant={isCritical ? 'destructive' : 'warning'}
      className="border-l-0 border-r-0 rounded-none [&>svg]:left-6 pl-6 [&>svg]:w-[26px]
[&>svg]:h-[26px]"
    >
      <IconAlertTriangle />
      <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
      <div className="absolute top-5 right-4 flex items-center space-x-2">
        {learnMoreUrl !== undefined && (
          <Link passHref href={learnMoreUrl}>
            <a>
              <Button type="default" icon={<IconExternalLink />}>
                Learn more
              </Button>
            </a>
          </Link>
        )}
        {correctionUrl !== undefined && (
          <Link passHref href={correctionUrl}>
            <a>
              <Button type="default">{buttonText}</Button>
            </a>
          </Link>
        )}
      </div>
    </Alert_Shadcn_>
  )
}

export default ResourceExhaustionWarningBanner
