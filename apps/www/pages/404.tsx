import { NextPage } from 'next'
import DefaultLayout from '../components/Layouts/Default'
import { ErrorPage } from 'ui'

const Error404: NextPage = () => {
  return (
    <DefaultLayout hideHeader hideFooter>
      <ErrorPage />
    </DefaultLayout>
  )
}

export default Error404
