import { screen } from '@testing-library/react'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { test } from 'vitest'
import { render } from '../../helpers'

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
