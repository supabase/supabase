import LoginForm from '@/components/Auth/LoginForm'
import type { Metadata } from 'next'
import { LoginDialog } from './LoginDialog'
import NewThreadInput from './NewThreadInput'

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
      <main role="main" className="h-[calc(100vh-115px)] w-full flex flex-col grow">
        <div className="h-full flex items-center justify-center w-full flex-col gap-y-4">
          <NewThreadInput />
        </div>
        <LoginDialog>
          <LoginForm searchParams={searchParams} />
        </LoginDialog>
      </main>
    </>
  )
}

export default NewThread
