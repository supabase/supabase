import {
  COMPUTE_BASELINE_IOPS,
  COMPUTE_BASELINE_THROUGHPUT,
  COMPUTE_DISK,
  COMPUTE_MAX_IOPS,
  COMPUTE_MAX_THROUGHPUT,
} from 'shared-data'

export function ComputeDiskLimitsTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Compute Instance</th>
          <th>Baseline Throughput (MB/s)</th>
          <th>Max Throughput (MB/s)</th>
          <th>Baseline IOPS</th>
          <th>Max IOPS</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(COMPUTE_DISK).map(([key, value]) => (
          <tr key={key}>
            <td>{value.name}</td>
            <td>{COMPUTE_BASELINE_THROUGHPUT[key]?.toLocaleString()} MB/s</td>
            <td>{COMPUTE_MAX_THROUGHPUT[key]?.toLocaleString()} MB/s</td>
            <td>{COMPUTE_BASELINE_IOPS[key]?.toLocaleString()} IOPS</td>
            <td>{COMPUTE_MAX_IOPS[key]?.toLocaleString()} IOPS</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
