import { useState } from 'react'
import { Select, Collapsible, Button, IconChevronDown } from 'ui'
import throughputTable from '~/data/realtime/throughput.json'

export default function RealtimeLimitsEstimater({}) {
  const findTableValue = ({ computeAddOn, filters, rls, concurrency }) => {
    return throughputTable.find(
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

  const [expandPreview, setExpandPreview] = useState(false)

  const handleComputeAddOnSelection = (e) => {
    const val = e.target.value
    setComputeAddOn(val)
    setConcurrency(500)
    setLimits(findTableValue({ computeAddOn: val, filters, rls, concurrency: 500 }))
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
      <div className="grid mb-8 gap-y-8 gap-x-8 grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="computeAddOn">Compute:</label>
          <Select id="computeAddOn" className="font-mono" onChange={handleComputeAddOnSelection}>
            <Select.Option value="micro">Micro</Select.Option>
            <Select.Option value="small">Small to medium</Select.Option>
            <Select.Option value="large">Large to 16XL</Select.Option>
          </Select>
        </div>

        <div>
          <label htmlFor="filters">Filters:</label>
          <Select
            id="filters"
            className="font-mono"
            disabled={true}
            onChange={handleFiltersSelection}
          >
            <Select.Option value="false">No</Select.Option>
            <Select.Option value="true">Yes</Select.Option>
          </Select>
        </div>

        <div>
          <label htmlFor="rls">RLS:</label>
          <Select id="rls" className="font-mono" onChange={handleRLSSelection}>
            <Select.Option value="false">No</Select.Option>
            <Select.Option value="true">Yes</Select.Option>
          </Select>
        </div>

        <div>
          <label htmlFor="concurrency">Connected clients:</label>
          <Select id="concurrency" className="font-mono" onChange={handleConcurrencySelection}>
            {throughputTable
              .filter(
                (l) => l.computeAddOn === computeAddOn && l.filters === filters && l.rls === rls
              )
              .map((l) => (
                <Select.Option
                  value={l.concurrency.toString()}
                  selected={l.concurrency === concurrency}
                >
                  {Intl.NumberFormat().format(l.concurrency)}
                </Select.Option>
              ))}
          </Select>
        </div>
      </div>

      {limits && (
        <div className="mt-8">
          <h4>Current maximum possible throughput</h4>

          <table className="table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Total DB changes /sec</th>
                <th className="px-4 py-2">Max messages per client /sec</th>
                <th className="px-4 py-2">Max total messages /sec</th>
                <th className="px-4 py-2">Latency p95</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">{limits.maxDBChanges}</td>
                <td className="border px-4 py-2">{limits.maxMessagesPerClient}</td>
                <td className="border px-4 py-2">
                  {Intl.NumberFormat().format(limits.totalMessagesPerSecond)}
                </td>
                <td className="border px-4 py-2">{limits.p95Latency}ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Collapsible open={expandPreview} onOpenChange={setExpandPreview}>
        <Collapsible.Trigger asChild>
          <div className="py-1 flex items-center">
            <p className="text-sm">View raw throughput table</p>
            <Button
              type="text"
              icon={
                <IconChevronDown
                  size={18}
                  strokeWidth={2}
                  className={expandPreview && 'rotate-180'}
                />
              }
              className="px-1"
              onClick={() => setExpandPreview(!expandPreview)}
            />
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div>
            {throughputTable
              .map((l) => l.computeAddOn)
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((computeAddOn) => (
                <div>
                  <h4>
                    {computeAddOn === 'micro'
                      ? 'Micro'
                      : computeAddOn === 'small'
                        ? 'Small to medium'
                        : 'Large to 16XL'}
                  </h4>
                  <table className="table-auto">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Filters</th>
                        <th className="px-4 py-2">RLS</th>
                        <th className="px-4 py-2">Connected clients</th>
                        <th className="px-4 py-2">Total DB changes /sec</th>
                        <th className="px-4 py-2">Max messages per client /sec</th>
                        <th className="px-4 py-2">Max total messages /sec</th>
                        <th className="px-4 py-2">Latency p95</th>
                      </tr>
                    </thead>
                    <tbody>
                      {throughputTable
                        .filter((l) => l.computeAddOn === computeAddOn)
                        .map((l) => (
                          <tr>
                            <td className="border px-4 py-2">{l.filters ? '✅' : '🚫'}</td>
                            <td className="border px-4 py-2">{l.rls ? '✅' : '🚫'}</td>
                            <td className="border px-4 py-2">
                              {Intl.NumberFormat().format(l.concurrency)}
                            </td>
                            <td className="border px-4 py-2">{l.maxDBChanges}</td>
                            <td className="border px-4 py-2">{l.maxMessagesPerClient}</td>
                            <td className="border px-4 py-2">
                              {Intl.NumberFormat().format(l.totalMessagesPerSecond)}
                            </td>
                            <td className="border px-4 py-2">{l.p95Latency}ms</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}
