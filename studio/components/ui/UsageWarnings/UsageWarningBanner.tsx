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

// [TODO] Just double check if the docs url and correction urls are all correct
const RESOURCE_WARNING_MESSAGES = {
  is_readonly_mode_enabled: {
    title: 'Your project is currently in readonly mode and is no longer accepting write requests',
    description:
      'You will need to manually override read-only mode and reduce the disk size to below 95%.',
    docsUrl: 'https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode',
    correctionUrl: undefined,
    buttonText: undefined,
  },
  is_disk_io_budget_below_threshold: {
    title:
      'Your project is about to deplete its Disk IO Budget, and your instance may become unresponsive once fully exhausted',
    description:
      'You will need to either optimize your performance, or upgrade your compute to a larger instance.',
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-disk-io',
    correctionUrl: '/project/[ref]/settings/billing/usage#disk_io',
    buttonText: 'Check usage',
  },
  is_disk_space_usage_beyond_threshold: {
    title:
      'Your project is about to exhaust its disk space budget, and your instance may become unresponsive once fully exhausted',
    description: 'Some CTA description here',
    docsUrl: undefined,
    correctionUrl: undefined,
    buttonText: undefined,
  },
  is_cpu_load_beyond_threshold: {
    title:
      "Your project is currently facing high CPU usage, and your instance's performance is affected",
    description:
      'You will need to either optimize your performance or upgrade your compute to a larger instance',
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-cpu',
    correctionUrl: '/project/[ref]/settings/billing/usage#cpu',
    buttonText: 'Check usage',
  },
  is_memory_and_swap_usage_beyond_threshold: {
    title:
      "Your project is currently facing high memory usage, and your instance's performance is affected",
    description:
      'You will need to either optimize your performance or upgrade your compute to a larger instance',
    docsUrl: 'https://supabase.com/docs/guides/platform/exhaust-ram',
    correctionUrl: '/project/[ref]/settings/billing/usage#ram',
    buttonText: 'Check usage',
  },
  multiple_resource_warnings: {
    title:
      "Your project is currently exhausting multiple resources, and your instance's performance is affected",
    description: "Check which resources are reaching their threshold on your project's usage page.",
    docsUrl: undefined,
    correctionUrl: '/project/[ref]/settings/billing/usage',
    buttonText: 'Check usage',
  },
}

const UsageWarningBanner = () => {
  const { ref } = useParams()
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const projectResourceWarnings = (resourceWarnings ?? [])?.find(
    (warning) => warning.project === ref
  )

  // [Joshen] Read only takes higher precendence over multiple resource warnings
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

  if (activeWarnings.length === 0) return null

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
