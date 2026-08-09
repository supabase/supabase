import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/protected')({
  component: Info,
  loader: async ({ context }) => {
    return {
      user: context.user!,
    }
  },
})

function Info() {
  const data = Route.useLoaderData()

  return <p>Hello {data.user.email}</p>
}
