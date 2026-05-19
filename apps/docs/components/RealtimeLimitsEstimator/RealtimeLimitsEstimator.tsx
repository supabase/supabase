import throughputTable from '~/data/realtime/throughput.json'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'

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

  const handleComputeAddOnSelection = (val) => {
    setComputeAddOn(val)
    setConcurrency(500)
    setLimits(findTableValue({ computeAddOn: val, filters, rls, concurrency: 500 }))
  }

  const handleFiltersSelection = (value) => {
    const val = value.toLowerCase() === 'true'
    setFilters(val)
    setConcurrency(500)
    setLimits(findTableValue({ computeAddOn, filters: val, rls, concurrency: 500 }))
  }

  const handleRLSSelection = (value) => {
    const val = value.toLowerCase() === 'true'
    setRLS(val)
    setConcurrency(500)
    setLimits(findTableValue({ computeAddOn, filters, rls: val, concurrency: 500 }))
  }

  const handleConcurrencySelection = (value) => {
    const val = parseInt(value)
    setConcurrency(val)
    setLimits(findTableValue({ computeAddOn, filters, rls, concurrency: val }))
  }

  return (
    <div>
      <h4>Set your expected parameters</h4>
      <div className="grid mb-8 gap-y-8 gap-x-8 grid-cols-2 xl:grid-cols-4">
        <div>
          <Label htmlFor="computeAddOn">Compute:</Label>
          <Select onValueChange={handleComputeAddOnSelection} value={computeAddOn}>
            <SelectTrigger id="computeAddOn">
              <SelectValue className="font-mono" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="micro">Micro</SelectItem>
              <SelectItem value="small">Small to medium</SelectItem>
              <SelectItem value="large">Large to 16XL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filters">Filters:</Label>
          <Select onValueChange={handleFiltersSelection} value={filters.toString()} disabled>
            <SelectTrigger id="filters">
              <SelectValue className="font-mono" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rls">RLS:</Label>
          <Select onValueChange={handleRLSSelection} value={rls.toString()}>
            <SelectTrigger id="rls">
              <SelectValue className="font-mono" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="concurrency">Connected clients:</Label>
          <Select onValueChange={handleConcurrencySelection} value={concurrency.toString()}>
            <SelectTrigger id="concurrency">
              <SelectValue className="font-mono" />
            </SelectTrigger>
            <SelectContent>
              {throughputTable
                .filter(
                  (l) => l.computeAddOn === computeAddOn && l.filters === filters && l.rls === rls
                )
                .map((l) => (
                  <SelectItem key={l.concurrency} value={l.concurrency.toString()}>
                    {Intl.NumberFormat().format(l.concurrency)}
                  </SelectItem>
                ))}
            </SelectContent>
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
        <CollapsibleTrigger asChild>
          <div className="py-1 flex items-center">
            <p className="text-sm">View raw throughput table</p>
            <Button
              type="text"
              icon={
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  className={expandPreview ? 'rotate-180' : undefined}
                />
              }
              className="px-1"
              onClick={() => setExpandPreview(!expandPreview)}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
