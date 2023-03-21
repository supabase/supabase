import { NextPage } from 'next'
import { ErrorPage } from 'ui'

import { useStore } from 'hooks'

const Error404: NextPage = ({}) => {
  const { ui } = useStore()
  const { theme } = ui

  return <ErrorPage isDarkMode={theme} />
}

export default Error404
