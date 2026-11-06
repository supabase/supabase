import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { EdgeFunctionInvocationsSection } from './EdgeFunctionInvocationsSection'
import { customRender } from '@/tests/lib/custom-render'

it('announces loading, empty, and failed invocation charts through one persistent polite status', () => {
  const props = {
    dateTimeFormat: 'HH:mm',
    totalInvocationCount: 0,
    totalErrorCount: 0,
    totalWarningCount: 0,
    isLoadingFunction: false,
    isErrorFunction: false,
    isLoadingChart: true,
    isErrorChart: false,
    chartData: [],
    onChartClick: () => {},
  }
  const { rerender } = customRender(<EdgeFunctionInvocationsSection {...props} />)
  const status = screen.getByRole('status')
  expect(status).toHaveAttribute('aria-live', 'polite')
  expect(status).toHaveTextContent('Loading invocations')

  rerender(<EdgeFunctionInvocationsSection {...props} isLoadingChart={false} />)
  expect(screen.getByRole('status')).toBe(status)
  expect(status).toHaveTextContent('No invocation data to show')
  expect(screen.getByText('No data to show')).toBeVisible()

  rerender(
    <EdgeFunctionInvocationsSection
      {...props}
      isLoadingChart={false}
      isErrorChart
      chartErrorMessage="Request failed"
    />
  )
  expect(screen.getByRole('status')).toBe(status)
  expect(status).toHaveTextContent('Unable to load invocations. Request failed')
  expect(screen.getByText('Request failed')).toBeVisible()

  rerender(
    <EdgeFunctionInvocationsSection
      {...props}
      isLoadingChart={false}
      chartData={[
        { timestamp: '2026-03-20T10:00:00Z', ok_count: 1, warning_count: 0, error_count: 0 },
      ]}
    />
  )
  expect(screen.getByRole('status')).toBe(status)
  expect(status).toBeEmptyDOMElement()
})
