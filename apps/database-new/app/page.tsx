// import LoginForm from '@/components/Auth/LoginForm'
import type { Metadata } from 'next'
import { LoginDialog } from './LoginDialog'
import NewThreadInput from './NewThreadInput'
import LoginForm from '@/components/Auth/LoginForm'
import RecentlyGenerated from '@/components/RecentlyGenerated'

export const metadata: Metadata = {
  title: 'database.design | Create',
}

const NewThread = async ({
  searchParams,
}: {
  searchParams: { prompt: string; message: string }
}) => {
  return (
    <>
      <div className="h-full flex items-center justify-center w-full flex-col gap-y-4">
        <NewThreadInput />
        {/* @Terry - just throwing this in here for now.
        we may want to reconfigre the h-full/justify-center of the input  */}
        <RecentlyGenerated />
      </div>
      <LoginDialog>
        <LoginForm searchParams={searchParams} />
      </LoginDialog>
    </>
  )
}

export default NewThread
