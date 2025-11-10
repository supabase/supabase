import { PageContainer } from 'ui-patterns/PageContainer'

export default function PageContainerDemo() {
  return (
    <div className="w-full space-y-4">
      <PageContainer size="small" className="bg-muted border rounded-lg p-4">
        <p>This is a page container with small size (768px max-width)</p>
      </PageContainer>
      <PageContainer size="default" className="bg-muted border rounded-lg p-4">
        <p>This is a page container with default size (1200px max-width)</p>
      </PageContainer>
      <PageContainer size="large" className="bg-muted border rounded-lg p-4">
        <p>This is a page container with large size (1600px max-width)</p>
      </PageContainer>
      <PageContainer size="full" className="bg-muted border rounded-lg p-4">
        <p>This is a page container with full size (no max-width)</p>
      </PageContainer>
    </div>
  )
}
