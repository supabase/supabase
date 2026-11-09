import { useFlag } from 'common'

export function useIsV3AdvancedDeploymentEnabled(organizationSlug: string | undefined) {
  const allowedOrganizations = useFlag<string>('orgsAllowedToUseV3AdvancedDeployment')

  return (
    !!organizationSlug &&
    typeof allowedOrganizations === 'string' &&
    allowedOrganizations.split(',').some((slug) => slug.trim() === organizationSlug)
  )
}
