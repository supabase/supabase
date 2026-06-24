import { screen } from '@testing-library/react'
import { test } from 'vitest'

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
