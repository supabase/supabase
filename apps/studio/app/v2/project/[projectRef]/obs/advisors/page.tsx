import { redirect } from 'next/navigation'

export default async function ObsAdvisorsSecurityPage({
  params,
}: {
  params: Promise<{ projectRef: string }>
}) {
  const { projectRef } = await params
  redirect(`/v2/project/${projectRef}/advisors/security`)
}
