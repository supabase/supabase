import { vi } from 'vitest'

const useLogsQuery = vi.fn().mockReturnValue({
  logData: [],
  params: {
    iso_timestamp_start: '',
  },
})
export default useLogsQuery
