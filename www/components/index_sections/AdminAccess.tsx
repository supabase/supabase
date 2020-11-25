import Tabs from '../tabs'

const AdminAccess = () => {
  return (
    <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
      <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
        <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div className="relative">
            <small>MADE FOR DEVELOPERS</small>
            <h2 className="text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
              Organise your app, without a developer
            </h2>
            <div className="mt-6">
            <Tabs />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAccess
