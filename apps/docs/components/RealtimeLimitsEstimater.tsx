import { find, set } from 'lodash'
import { useState } from 'react'
import { Select } from 'ui'

const table = [
  {
    computeAddOn: 'micro',
    filters: true,
    rls: true,
    concurrency: NaN,
    maxDBChanges: NaN,
    maxMessagesPerClient: NaN,
    totalMessagesPerSecond: NaN,
    p95Latency: NaN,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: false,
    concurrency: 500,
    maxDBChanges: 64,
    maxMessagesPerClient: 64,
    totalMessagesPerSecond: 32000,
    p95Latency: 238,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: false,
    concurrency: 5000,
    maxDBChanges: 10,
    maxMessagesPerClient: 10,
    totalMessagesPerSecond: 50000,
    p95Latency: 807,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: false,
    concurrency: 10000,
    maxDBChanges: 5,
    maxMessagesPerClient: 5,
    totalMessagesPerSecond: 50000,
    p95Latency: 1310,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: false,
    concurrency: 30000,
    maxDBChanges: 1,
    maxMessagesPerClient: 1,
    totalMessagesPerSecond: 30000,
    p95Latency: 941,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: true,
    concurrency: 500,
    maxDBChanges: 30,
    maxMessagesPerClient: 6,
    totalMessagesPerSecond: 3000,
    p95Latency: 228,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: true,
    concurrency: 1500,
    maxDBChanges: 10,
    maxMessagesPerClient: 2,
    totalMessagesPerSecond: 3000,
    p95Latency: 356,
  },
  {
    computeAddOn: 'micro',
    filters: false,
    rls: true,
    concurrency: 3000,
    maxDBChanges: 5,
    maxMessagesPerClient: 1,
    totalMessagesPerSecond: 3000,
    p95Latency: 616,
  },
  {
    computeAddOn: 'small',
    filters: true,
    rls: true,
    concurrency: NaN,
    maxDBChanges: NaN,
    maxMessagesPerClient: NaN,
    totalMessagesPerSecond: NaN,
    p95Latency: NaN,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: false,
    concurrency: 500,
    maxDBChanges: 64,
    maxMessagesPerClient: 64,
    totalMessagesPerSecond: 32000,
    p95Latency: 184,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: false,
    concurrency: 5000,
    maxDBChanges: 10,
    maxMessagesPerClient: 10,
    totalMessagesPerSecond: 50000,
    p95Latency: 782,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: false,
    concurrency: 10000,
    maxDBChanges: 5,
    maxMessagesPerClient: 5,
    totalMessagesPerSecond: 50000,
    p95Latency: 1349,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: false,
    concurrency: 35000,
    maxDBChanges: 1,
    maxMessagesPerClient: 1,
    totalMessagesPerSecond: 35000,
    p95Latency: 1287,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: true,
    concurrency: 500,
    maxDBChanges: 30,
    maxMessagesPerClient: 6,
    totalMessagesPerSecond: 3000,
    p95Latency: 282,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: true,
    concurrency: 1500,
    maxDBChanges: 10,
    maxMessagesPerClient: 2,
    totalMessagesPerSecond: 3000,
    p95Latency: 387,
  },
  {
    computeAddOn: 'small',
    filters: false,
    rls: true,
    concurrency: 3000,
    maxDBChanges: 5,
    maxMessagesPerClient: 1,
    totalMessagesPerSecond: 3000,
    p95Latency: 920,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: false,
    concurrency: 500,
    maxDBChanges: 64,
    maxMessagesPerClient: 64,
    totalMessagesPerSecond: 32000,
    p95Latency: 184,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: false,
    concurrency: 5000,
    maxDBChanges: 10,
    maxMessagesPerClient: 10,
    totalMessagesPerSecond: 50000,
    p95Latency: 672,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: false,
    concurrency: 10000,
    maxDBChanges: 5,
    maxMessagesPerClient: 5,
    totalMessagesPerSecond: 50000,
    p95Latency: 1253,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: false,
    concurrency: 35000,
    maxDBChanges: 1,
    maxMessagesPerClient: 1,
    totalMessagesPerSecond: 35000,
    p95Latency: 1257,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: true,
    concurrency: 500,
    maxDBChanges: 40,
    maxMessagesPerClient: 8,
    totalMessagesPerSecond: 4000,
    p95Latency: 618,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: true,
    concurrency: 2000,
    maxDBChanges: 10,
    maxMessagesPerClient: 2,
    totalMessagesPerSecond: 4000,
    p95Latency: 606,
  },
  {
    computeAddOn: 'large',
    filters: false,
    rls: true,
    concurrency: 4000,
    maxDBChanges: 5,
    maxMessagesPerClient: 1,
    totalMessagesPerSecond: 4000,
    p95Latency: 918,
  },
]

export default function RealtimeLimitsEstimater({}) {
  const findTableValue = ({ computeAddOn, filters, rls, concurrency }) => {
    return table.find(
      (l) =>
        l.computeAddOn === computeAddOn &&
        l.filters === filters &&
        l.rls === rls &&
        l.concurrency === concurrency
    )
  }

  const [computeAddOn, setComputeAddOn] = useState('micro')
  const [filters, setFilters] = useState(false)
  const [rls, setRLS] = useState(false)
  const [concurrency, setConcurrency] = useState(500)

  const [limits, setLimits] = useState(findTableValue({ computeAddOn, filters, rls, concurrency }))

  const handleComputeAddOnSelection = (e) => {
    const val = e.target.value
    setComputeAddOn(val)
    setConcurrency(500)
    setFilters(false)
    setRLS(false)
    setLimits(findTableValue({ computeAddOn: val, filters: false, rls: false, concurrency: 500 }))
  }

  const handleFiltersSelection = (e) => {
    const val = e.target.value.toLowerCase() === 'true'
    setFilters(val)
    setConcurrency(500)
    setLimits(findTableValue({ computeAddOn, filters: val, rls, concurrency: 500 }))
  }

  const handleRLSSelection = (e) => {
    const val = e.target.value.toLowerCase() === 'true'
    setRLS(val)
    setConcurrency(500)
    setLimits(findTableValue({ computeAddOn, filters, rls: val, concurrency: 500 }))
  }

  const handleConcurrencySelection = (e) => {
    const val = parseInt(e.target.value)
    setConcurrency(val)
    setLimits(findTableValue({ computeAddOn, filters, rls, concurrency: val }))
  }

  return (
    <div>
      <h4>Set your expected parameters</h4>
      <div className="grid mb-8 gap-y-8 gap-x-8 grid-cols-4">
        <div>
          <label htmlFor="computeAddOn">Compute:</label>
          <Select
            id="computeAddOn"
            style={{ fontFamily: 'monospace' }}
            onChange={handleComputeAddOnSelection}
          >
            <Select.Option value="micro">Micro</Select.Option>
            <Select.Option value="small">Small to medium</Select.Option>
            <Select.Option value="large">Large to 16XL</Select.Option>
          </Select>
        </div>

        <div>
          <label htmlFor="filters">Filters:</label>
          <Select
            id="filters"
            style={{ fontFamily: 'monospace' }}
            disabled={true}
            onChange={handleFiltersSelection}
          >
            <Select.Option value="false">No</Select.Option>
            <Select.Option value="true">Yes</Select.Option>
          </Select>
        </div>

        <div>
          <label htmlFor="rls">RLS:</label>
          <Select id="rls" style={{ fontFamily: 'monospace' }} onChange={handleRLSSelection}>
            <Select.Option value="false">No</Select.Option>
            <Select.Option value="true">Yes</Select.Option>
          </Select>
        </div>

        <div>
          <label htmlFor="concurrency">Concurrency:</label>
          <Select
            id="concurrency"
            style={{ fontFamily: 'monospace' }}
            onChange={handleConcurrencySelection}
          >
            {table
              .filter(
                (l) => l.computeAddOn === computeAddOn && l.filters === filters && l.rls === rls
              )
              .map((l) => (
                <Select.Option
                  value={l.concurrency.toString()}
                  selected={l.concurrency === concurrency}
                >
                  {l.concurrency.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Select.Option>
              ))}
          </Select>
        </div>
      </div>

      {limits && (
        <div className="mt-8">
          <h4>Current Maximum Possible Throughput</h4>

          <table className="table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Total DB Changes /sec</th>
                <th className="px-4 py-2">Max Messages Per Client /sec</th>
                <th className="px-4 py-2">Max Total Messages /sec</th>
                <th className="px-4 py-2">Latency p95</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">{limits.maxDBChanges}</td>
                <td className="border px-4 py-2">{limits.maxMessagesPerClient}</td>
                <td className="border px-4 py-2">
                  {limits.totalMessagesPerSecond.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </td>
                <td className="border px-4 py-2">{limits.p95Latency}ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
