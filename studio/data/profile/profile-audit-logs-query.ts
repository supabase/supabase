import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import dayjs from 'dayjs'
import { ResponseError } from 'types'
import { profileKeys } from './keys'

export type ProfileAuditLogsVariables = {
  iso_timestamp_start?: string
  iso_timestamp_end?: string
}

export async function getProfileAuditLogs(
  { iso_timestamp_start, iso_timestamp_end }: ProfileAuditLogsVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get('/platform/profile/audit', {
    params: {
      query: {
        iso_timestamp_start,
        iso_timestamp_end,
      },
    },
    signal,
  })

  if (error) throw error
  return data
}

export type ProfileAuditLogsData = Awaited<ReturnType<typeof getProfileAuditLogs>>
export type ProfileAuditLogsError = ResponseError

export const useProfileAuditLogsQuery = <TData = ProfileAuditLogsData>(
  vars: ProfileAuditLogsVariables,
  options: UseQueryOptions<ProfileAuditLogsData, ProfileAuditLogsError, TData> = {}
) => {
  const { iso_timestamp_start, iso_timestamp_end } = vars
  const date_start = dayjs(iso_timestamp_start).utc().format('YYYY-MM-DD')
  const date_end = dayjs(iso_timestamp_end).utc().format('YYYY-MM-DD')

  return useQuery<ProfileAuditLogsData, ProfileAuditLogsError, TData>(
    profileKeys.auditLogs({ date_start, date_end }),
    ({ signal }) => getProfileAuditLogs(vars, signal),
    {
      ...options,
    }
  )
}
