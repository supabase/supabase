import Link from 'next/link'
import { useParams } from 'common'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconExternalLink,
} from 'ui'

import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { RESOURCE_WARNING_MESSAGES } from './UsageWarningBanner.constants'
import { useRouter } from 'next/router'

const UsageWarningBanner = () => {
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
              projectResourceWarnings[property as keyof typeof projectResourceWarnings] === true
          )
      : []

  const hasHighPriorityWarning = activeWarnings.includes('is_readonly_mode_enabled')

  const title =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.title
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.title
  const description =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.description
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.description
  const learnMoreUrl =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.docsUrl
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.docsUrl
  const correctionUrl = (
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.correctionUrl
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.correctionUrl
  )?.replace('[ref]', ref ?? 'default')
  const buttonText =
    activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.buttonText
      : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
          ?.buttonText

  if (activeWarnings.length === 0 || router.pathname.includes('/usage')) return null

  return (
    <Alert_Shadcn_
      variant={hasHighPriorityWarning ? 'destructive' : 'warning'}
      className="border-l-0 border-r-0 rounded-none"
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

export default UsageWarningBanner
