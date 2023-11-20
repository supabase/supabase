import { UserMessage } from '@/lib/types'

interface UserChatProps {
  message: UserMessage
}

const UserChat = ({ message }: UserChatProps) => {
  return (
    <div key={message.id} className="text-sm bg-surface-100 p-4 w-3/4 rounded-lg">
      {message.text}
    </div>
  )
}

export default UserChat
