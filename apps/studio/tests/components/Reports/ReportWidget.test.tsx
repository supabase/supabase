import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { render } from '../../helpers'
import ReportWidget from '@/components/interfaces/Reports/ReportWidget'

test('static elements', async () => {
  render(
    <ReportWidget
      isLoading={false}
      data={[]}
      title="Some chart"
      resolvedSql="select"
      renderer={() => 'something'}
    />
  )
  await screen.findByText(/something/)
  await screen.findByText(/Some chart/)
})

test('append', async () => {
  const appendable = () => 'some text'
  render(
    <ReportWidget
      title="hola"
      isLoading={false}
      data={[]}
      renderer={() => null}
      append={appendable}
    />
  )
  await screen.findByText(/some text/)
})

test('keeps renderer loading state when the overlay spinner is disabled', () => {
  render(
    <ReportWidget
      title="Database Size"
      isLoading
      showLoadingSpinner={false}
      data={[]}
      renderer={({ isLoading }) => <span>{isLoading ? 'Loading data' : 'No data'}</span>}
    />
  )

  expect(screen.getByText('Loading data')).toBeInTheDocument()
  expect(screen.queryByText('No data')).not.toBeInTheDocument()
})
