// import LoginForm from '@/components/Auth/LoginForm'
import type { Metadata } from 'next'
import { LoginDialog } from './LoginDialog'
import LoginForm from '@/components/Auth/LoginForm'
import RecentlyGenerated from '@/components/RecentlyGenerated'
import { AssistantChatForm } from '@/components/AssistantChatForm'

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
        <div className="relative w-10/12 xl:w-11/12 max-w-xl">
          <AssistantChatForm
            key="new-thread-form"
            placeholder="e.g Create a Telegram-like chat application"
          />
        </div>

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
