import { useRouter } from 'next/router'

import { useTelemetryProps } from 'common'
import { useProfileCreateMutation } from 'data/profile/profile-create-mutation'
import { useProfileQuery } from 'data/profile/profile-query'
import Telemetry from 'lib/telemetry'

/**
 * Fetches the user's profile, creating one if it does not exist
 */
function useProfile() {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const { mutate: createProfile, isLoading: isCreating } = useProfileCreateMutation({
    onSuccess() {
      Telemetry.sendEvent(
        { category: 'conversion', action: 'sign_up', label: '' },
        telemetryProps,
        router
      )
    },
  })

  const { isLoading, ...result } = useProfileQuery({
    onError(err) {
      // if the user does not yet exist, create a profile for them
      if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 404) {
        createProfile()
      }
    },
  })

  return {
    // Continue the loading state until the profile is created
    isLoading: isLoading || isCreating,
    ...result,
  }
}

export default useProfile
