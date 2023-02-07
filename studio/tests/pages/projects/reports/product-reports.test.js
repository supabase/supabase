import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

import { get, post } from 'lib/common/fetch'

import { useRouter } from 'next/router'
import { useParams } from 'hooks'
import { render } from '../../../helpers'
import { fireEvent, waitFor, screen } from '@testing-library/react'
import { ApiReport } from 'pages/project/[ref]/reports/api'
import { AuthReport } from 'pages/project/[ref]/reports/auth'
import userEvent from '@testing-library/user-event'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  post.mockReset()
  useRouter.mockReset()
  useRouter.mockReturnValue({
    query: { ref: '123' },
  })
  useParams.mockReturnValue({ ref: '123' })
  get.mockImplementation(async (url) => {
    return [{ data: [] }]
  })
  get.mockResolvedValue([])
  post.mockResolvedValue([])
})

describe.each([
  { Page: ApiReport, contains: ['API'] },
  { Page: AuthReport, contains: ['Auth'] },
])('$Page rendering', ({ Page, contains }) => {
  test(`contains ${contains}`, async () => {
    render(<Page />)

    contains.forEach((word) => {
      expect(screen.findByText(word)).resolves.toBeTruthy()
    })
  })
  test('static elements', async () => {
    render(<Page />)
    await screen.findByText(/Last 7 days/)
    await screen.findAllByText(/Refresh/)
  })
})
