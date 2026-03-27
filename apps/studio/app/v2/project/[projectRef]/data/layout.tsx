import { StudioDataWorkspace } from '@/components/v2/data/StudioDataWorkspace'

export default async function DataLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectRef: string }>
}) {
  const { projectRef } = await params
  return <StudioDataWorkspace projectRef={projectRef}>{children}</StudioDataWorkspace>
}
