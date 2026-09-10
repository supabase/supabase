import Layout from '~/layouts/guides'

export default async function DeploymentLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
