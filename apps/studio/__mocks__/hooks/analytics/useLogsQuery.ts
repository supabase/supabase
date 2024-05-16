const useLogsQuery = jest.fn().mockReturnValue({
  logData: [],
  params: {
    iso_timestamp_start: '',
  },
})
export default useLogsQuery
