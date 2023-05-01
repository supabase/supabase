import { get } from 'lib/common/fetch'
import { useRouter } from 'next/router'
import { screen } from '@testing-library/react'
import { render } from '../../helpers'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  useRouter.mockReset()
  useRouter.mockReturnValue(defaultRouterMock())
})

test('static elements', async () => {
  render(<ReportWidget data={[]} title="Some chart" sql="select" renderer={() => 'something'} />)
  await screen.findByText(/Some chart/)
  await screen.findByText(/something/)
})

test("lazy load component expandable", async ()=>{
  const Expandable = ()=> "expanded"
  render(<ReportWidget data={[]} renderer={() => null} expandable={Expandable} />)
  await screen.findByText(/Expand/)
})

test("customize expandable text", async ()=>{
  render(<ReportWidget data={[]} renderer={() => null} expandable={()=> null} expandableText="open_me"/>)
  await screen.findByText(/open_me/)
})