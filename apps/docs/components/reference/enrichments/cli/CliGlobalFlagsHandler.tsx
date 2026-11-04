import Param from '~/components/Params'
import { getCliSpec } from '~/features/docs/Reference.generated.singleton'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'
import { isFeatureEnabled } from 'common'

const { cliDisableCustomProfiles } = isFeatureEnabled(['cli:disable_custom_profiles'])

const CliGlobalFlagsHandler = async ({ version }: { version?: string }) => {
  const spec = await getCliSpec(version)

  // Only fetch cliProfile when custom profiles are enabled
  const cliProfile = !cliDisableCustomProfiles
    ? getCustomContent(['cli:profile'] as any).cliProfile
    : undefined

  // Transform the flags based on feature flags
  const processedFlags = spec.flags.map(
    (flag): { id: string; name: string; description: string; required?: boolean } => {
      if (flag.id === 'profile' && !cliDisableCustomProfiles) {
        return {
          id: 'profile',
          name: `--profile ${cliProfile}`,
          description: `use ${cliProfile} profile for connecting to Supabase API`,
        }
      }
      return flag
    }
  )

  return (
    <RefSubLayout.EducationRow className="not-prose">
      <RefSubLayout.Details>
        <h3 className="text-lg text-foreground mb-3">Flags</h3>
        <ul>
          {processedFlags.map((flag) => {
            return (
              <Param
                {...flag}
                key={flag.id}
                id={`${spec.info.id}-${flag.id}`}
                isOptional={flag.required === undefined ? true : !flag.required}
              ></Param>
            )
          })}
        </ul>
      </RefSubLayout.Details>

      <RefSubLayout.Examples></RefSubLayout.Examples>
    </RefSubLayout.EducationRow>
  )
}

export default CliGlobalFlagsHandler
