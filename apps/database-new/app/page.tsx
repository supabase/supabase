import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import NewThreadInput from './NewThreadInput'
import { LoginDialog } from './LoginDialog'
import LoginForm from '@/components/Auth/LoginForm'

export const metadata: Metadata = {
  title: 'database.design | Create',
}

const NewThread = async ({
  searchParams,
}: {
  searchParams: { prompt: string; message: string }
}) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('searchParams on page level', searchParams)

  return (
    <>
      <div className="h-full flex items-center justify-center w-full flex-col gap-y-4">
        <NewThreadInput userID={user?.id} />
      </div>
      <LoginDialog>
        <LoginForm searchParams={searchParams} />
      </LoginDialog>
    </>
  )
}

export default NewThread
