import { COMPUTE_BASELINE_IOPS, COMPUTE_BASELINE_THROUGHPUT } from 'shared-data'

export function ComputeDiskLimitsTableRows() {
  const rows = [
    { key: 'ci_nano', label: 'Nano (free)' },
    { key: 'ci_micro', label: 'Micro' },
    { key: 'ci_small', label: 'Small' },
    { key: 'ci_medium', label: 'Medium' },
    { key: 'ci_large', label: 'Large' },
    { key: 'ci_xlarge', label: 'XL' },
    { key: 'ci_2xlarge', label: '2XL' },
    { key: 'ci_4xlarge', label: '4XL' },
    { key: 'ci_8xlarge', label: '8XL' },
    { key: 'ci_12xlarge', label: '12XL' },
    { key: 'ci_16xlarge', label: '16XL' },
  ]

  return (
    <>
      {rows.map((row) => (
        <tr key={row.key}>
          <td>{row.label}</td>
          <td>{COMPUTE_BASELINE_THROUGHPUT[row.key]?.toLocaleString()} MB/s</td>
          <td>{COMPUTE_BASELINE_IOPS[row.key]?.toLocaleString()} IOPS</td>
        </tr>
      ))}
    </>
  )
}
