import { useFlag } from 'common'

export function useEmergencyIncidentOverride(): boolean {
  const isFlagEnabled = useFlag('ongoingIncident')
  return isFlagEnabled || process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true'
}
