import { ExplorerChatTab } from '@/components/interfaces/Explorer/ExplorerChatTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import type { NextPageWithLayout } from '@/types'

const ChatPage: NextPageWithLayout = () => <ExplorerChatTab />

ChatPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ChatPage
