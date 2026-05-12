import RefSubLayout from '~/layouts/ref/RefSubLayout'

import spec from '~/spec/cli_v1_commands.yaml' with { type: 'yaml' }
import Param from '~/components/Params'
import { isFeatureEnabled } from 'common'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'

const { cliDisableCustomProfiles } = isFeatureEnabled(['cli:disable_custom_profiles'])

const CliGlobalFlagsHandler = () => {
  // Only fetch cliProfile when custom profiles are enabled
  const cliProfile = !cliDisableCustomProfiles
    ? getCustomContent(['cli:profile'] as any).cliProfile
    : undefined

  // Transform the flags based on feature flags
  const processedFlags = spec.flags.map((flag: any) => {
    if (flag.id === 'profile' && !cliDisableCustomProfiles) {
      return {
        id: 'profile',
        name: `--profile ${cliProfile}`,
        description: `use ${cliProfile} profile for connecting to Supabase API`,
      }
    }
    return flag
  })

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
                id={`${spec.id}-${flag.id}`}
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
