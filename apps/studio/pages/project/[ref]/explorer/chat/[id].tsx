import { ChatEditor } from '@/components/interfaces/Explorer/ChatEditor'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import type { NextPageWithLayout } from '@/types'

const ChatPage: NextPageWithLayout = () => <ChatEditor />

ChatPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ChatPage
