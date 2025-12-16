import {
  COMPUTE_BASELINE_IOPS,
  COMPUTE_BASELINE_THROUGHPUT,
  COMPUTE_DISK,
  COMPUTE_MAX_IOPS,
  COMPUTE_MAX_THROUGHPUT,
} from 'shared-data'

export function ComputeDiskLimitsTableRows() {
  return (
    <>
      {Object.entries(COMPUTE_DISK).map(([key, value]) => (
        <tr key={key}>
          <td>{value.name}</td>
          <td>{COMPUTE_BASELINE_THROUGHPUT[key]?.toLocaleString()} MB/s</td>
          <td>{COMPUTE_MAX_THROUGHPUT[key]?.toLocaleString()} MB/s</td>
          <td>{COMPUTE_BASELINE_IOPS[key]?.toLocaleString()} IOPS</td>
          <td>{COMPUTE_MAX_IOPS[key]?.toLocaleString()} IOPS</td>
        </tr>
      ))}
    </>
  )
}
