import { useQuery } from '@tanstack/react-query'

export type ConversationsVariables = {
  userId: string
  enabled?: boolean
}

// Just update based on the schema - or use the dashboard's type generation feature 😉
export type Conversation = {
  id: string
  name: string
  threadId: string
  runId: string
  createdAt: string
  updatedAt: string
}

export const useConversationsQuery = ({ userId, enabled }: ConversationsVariables) =>
  useQuery<Conversation[]>({
    queryKey: [userId, 'conversations'],
    enabled: enabled && !!userId,
    queryFn: async () => {
      // [Joshen] Just mocking the conversations data, to replace with fetching from Supabase
      const getConversations = (): Promise<Conversation[]> => {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve([
              {
                id: '1',
                name: 'Twitter clone',
                threadId: 'thread_vrXIl16bUusqFMUFYDw8CoEy',
                runId: 'run_4DiPb5ppb5hwY1y6dT1qEWzc',
                createdAt: '2022-07-29 07:53:58.560926+00',
                updatedAt: '2022-07-29 07:53:58.560926+00',
              },
              {
                id: '2',
                name: 'Supabase clone',
                threadId: 'thread_vrXIl16bUusqFMUFYDw8CoEy',
                runId: 'run_4DiPb5ppb5hwY1y6dT1qEWzc',
                createdAt: '2022-07-29 07:53:58.560926+00',
                updatedAt: '2022-07-30 07:53:58.560926+00',
              },
            ])
          }, 100)
        })
      }

      const result = await getConversations()
      return result
    },
  })
