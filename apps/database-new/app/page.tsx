// import LoginForm from '@/components/Auth/LoginForm'
import type { Metadata } from 'next'
import { LoginDialog } from './LoginDialog'
import NewThreadInput from './NewThreadInput'
import LoginForm from '@/components/Auth/LoginForm'

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
      </div>
      <LoginDialog>
        <LoginForm searchParams={searchParams} />
      </LoginDialog>
    </>
  )
}

export default NewThread
