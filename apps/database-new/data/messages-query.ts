// import { useQuery } from '@tanstack/react-query'

// import { ReadThreadAPIResult } from '@/lib/types'

// export type MessagesVariables = {
//   threadId: string
//   runId: string
//   enabled?: boolean
// }

// export const useMessagesQuery = ({ threadId, runId, enabled }: MessagesVariables) =>
//   useQuery<ReadThreadAPIResult>({
//     queryKey: [threadId, runId],
//     enabled: enabled && !!(threadId && runId),
//     queryFn: async () => {
//       const response = await fetch(`/api/ai/sql/threads/${threadId}/read/${runId}`, {
//         method: 'GET',
//       })
//       const result = await response.json()
//       return result
//     },
//     refetchInterval: (options) => {
//       const data = options.state.data
//       if (data && data.status === 'completed') {
//         return Infinity
//       } else return 5000
//     },
//   })
