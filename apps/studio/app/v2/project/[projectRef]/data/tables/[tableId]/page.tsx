import { redirect } from 'next/navigation'

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ projectRef: string; tableId: string }>
}) {
  const { projectRef, tableId } = await params
  redirect(`/v2/project/${projectRef}/data/tables/${tableId}/data`)
}
