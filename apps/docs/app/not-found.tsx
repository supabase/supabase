import { NotFound } from '~/features/recommendations/NotFound'

const NotFoundPage = () => (
  <div className="h-[100dvh] w-screen grid items-center justify-center">
    <NotFound omitSearch />
  </div>
)

export default NotFoundPage
