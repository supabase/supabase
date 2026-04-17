'use client'

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const data = [
  { month: '2020-03', newDevelopers: 11, cumulativeDevelopers: 11 },
  { month: '2020-04', newDevelopers: 43, cumulativeDevelopers: 54 },
  { month: '2020-05', newDevelopers: 1020, cumulativeDevelopers: 1074 },
  { month: '2020-06', newDevelopers: 463, cumulativeDevelopers: 1537 },
  { month: '2020-07', newDevelopers: 194, cumulativeDevelopers: 1731 },
  { month: '2020-08', newDevelopers: 438, cumulativeDevelopers: 2169 },
  { month: '2020-09', newDevelopers: 208, cumulativeDevelopers: 2377 },
  { month: '2020-10', newDevelopers: 278, cumulativeDevelopers: 2655 },
  { month: '2020-11', newDevelopers: 560, cumulativeDevelopers: 3215 },
  { month: '2020-12', newDevelopers: 2450, cumulativeDevelopers: 5665 },
  { month: '2021-01', newDevelopers: 1476, cumulativeDevelopers: 7141 },
  { month: '2021-02', newDevelopers: 1639, cumulativeDevelopers: 8780 },
  { month: '2021-03', newDevelopers: 2156, cumulativeDevelopers: 10936 },
  { month: '2021-04', newDevelopers: 4149, cumulativeDevelopers: 15085 },
  { month: '2021-05', newDevelopers: 5148, cumulativeDevelopers: 20233 },
  { month: '2021-06', newDevelopers: 3713, cumulativeDevelopers: 23946 },
  { month: '2021-07', newDevelopers: 5225, cumulativeDevelopers: 29171 },
  { month: '2021-08', newDevelopers: 4945, cumulativeDevelopers: 34116 },
  { month: '2021-09', newDevelopers: 4699, cumulativeDevelopers: 38815 },
  { month: '2021-10', newDevelopers: 5426, cumulativeDevelopers: 44241 },
  { month: '2021-11', newDevelopers: 5732, cumulativeDevelopers: 49973 },
  { month: '2021-12', newDevelopers: 7326, cumulativeDevelopers: 57299 },
  { month: '2022-01', newDevelopers: 8997, cumulativeDevelopers: 66296 },
  { month: '2022-02', newDevelopers: 7345, cumulativeDevelopers: 73641 },
  { month: '2022-03', newDevelopers: 7092, cumulativeDevelopers: 80733 },
  { month: '2022-04', newDevelopers: 6832, cumulativeDevelopers: 87565 },
  { month: '2022-05', newDevelopers: 8260, cumulativeDevelopers: 95825 },
  { month: '2022-06', newDevelopers: 7383, cumulativeDevelopers: 103208 },
  { month: '2022-07', newDevelopers: 8611, cumulativeDevelopers: 111819 },
  { month: '2022-08', newDevelopers: 10412, cumulativeDevelopers: 122231 },
  { month: '2022-09', newDevelopers: 12814, cumulativeDevelopers: 135045 },
  { month: '2022-10', newDevelopers: 11597, cumulativeDevelopers: 146642 },
  { month: '2022-11', newDevelopers: 14469, cumulativeDevelopers: 161111 },
  { month: '2022-12', newDevelopers: 17947, cumulativeDevelopers: 179058 },
  { month: '2023-01', newDevelopers: 19400, cumulativeDevelopers: 198458 },
  { month: '2023-02', newDevelopers: 19748, cumulativeDevelopers: 218206 },
  { month: '2023-03', newDevelopers: 23798, cumulativeDevelopers: 242004 },
  { month: '2023-04', newDevelopers: 25803, cumulativeDevelopers: 267807 },
  { month: '2023-05', newDevelopers: 27584, cumulativeDevelopers: 295391 },
  { month: '2023-06', newDevelopers: 27800, cumulativeDevelopers: 323191 },
  { month: '2023-07', newDevelopers: 32598, cumulativeDevelopers: 355789 },
  { month: '2023-08', newDevelopers: 33368, cumulativeDevelopers: 389157 },
  { month: '2023-09', newDevelopers: 32046, cumulativeDevelopers: 421203 },
  { month: '2023-10', newDevelopers: 35087, cumulativeDevelopers: 456290 },
  { month: '2023-11', newDevelopers: 34990, cumulativeDevelopers: 491280 },
  { month: '2023-12', newDevelopers: 31492, cumulativeDevelopers: 522772 },
  { month: '2024-01', newDevelopers: 37766, cumulativeDevelopers: 560538 },
  { month: '2024-02', newDevelopers: 38748, cumulativeDevelopers: 599286 },
  { month: '2024-03', newDevelopers: 43861, cumulativeDevelopers: 643147 },
  { month: '2024-04', newDevelopers: 46842, cumulativeDevelopers: 689989 },
  { month: '2024-05', newDevelopers: 48851, cumulativeDevelopers: 738840 },
  { month: '2024-06', newDevelopers: 43734, cumulativeDevelopers: 782574 },
  { month: '2024-07', newDevelopers: 46589, cumulativeDevelopers: 829163 },
  { month: '2024-08', newDevelopers: 51743, cumulativeDevelopers: 880906 },
  { month: '2024-09', newDevelopers: 59597, cumulativeDevelopers: 940503 },
  { month: '2024-10', newDevelopers: 65080, cumulativeDevelopers: 1005583 },
  { month: '2024-11', newDevelopers: 79022, cumulativeDevelopers: 1084605 },
  { month: '2024-12', newDevelopers: 128379, cumulativeDevelopers: 1212984 },
  { month: '2025-01', newDevelopers: 183374, cumulativeDevelopers: 1396358 },
  { month: '2025-02', newDevelopers: 216920, cumulativeDevelopers: 1613278 },
  { month: '2025-03', newDevelopers: 281763, cumulativeDevelopers: 1895041 },
  { month: '2025-04', newDevelopers: 345266, cumulativeDevelopers: 2240307 },
  { month: '2025-05', newDevelopers: 367844, cumulativeDevelopers: 2608151 },
  { month: '2025-06', newDevelopers: 400607, cumulativeDevelopers: 3008758 },
  { month: '2025-07', newDevelopers: 473642, cumulativeDevelopers: 3482400 },
  { month: '2025-08', newDevelopers: 537866, cumulativeDevelopers: 4020266 },
  { month: '2025-09', newDevelopers: 516752, cumulativeDevelopers: 4537018 },
  { month: '2025-10', newDevelopers: 401057, cumulativeDevelopers: 4938075 },
  { month: '2025-11', newDevelopers: 419106, cumulativeDevelopers: 5357181 },
  { month: '2025-12', newDevelopers: 502051, cumulativeDevelopers: 5859232 },
  { month: '2026-01', newDevelopers: 650802, cumulativeDevelopers: 6510034 },
  { month: '2026-02', newDevelopers: 616304, cumulativeDevelopers: 7126338 },
  { month: '2026-03', newDevelopers: 846186, cumulativeDevelopers: 7972524 },
  { month: '2026-04', newDevelopers: 27476, cumulativeDevelopers: 8000000 },
]

const formatYAxis = (value: number): string => {
  if (value >= 1_000_000) return `${value / 1_000_000}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

const isYearBoundary = (month: string, index: number): boolean => {
  return index === 0 || month.endsWith('-01')
}

const DeveloperGrowthChart = () => {
  return (
    <div className="my-8 -mx-4 sm:mx-0">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="developerGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand-600))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--brand-600))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground-lighter))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border-default))' }}
            tickFormatter={(value) => value.substring(0, 4)}
            ticks={data.filter((d, i) => isYearBoundary(d.month, i)).map((d) => d.month)}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground-lighter))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            width={40}
          />
          <Area
            type="monotone"
            dataKey="cumulativeDevelopers"
            stroke="hsl(var(--brand-600))"
            strokeWidth={2}
            fill="url(#developerGrowthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DeveloperGrowthChart
