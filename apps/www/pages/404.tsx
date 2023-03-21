import DefaultLayout from '../components/Layouts/Default'
import { useTheme } from 'common/Providers'
import { ErrorPage } from 'ui'

const Error404 = () => {
  const { isDarkMode } = useTheme()

  return <ErrorPage isDarkMode={isDarkMode} />
}

export default Error404
