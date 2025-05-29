import Layout from '~/layouts/guides'

export default async function GraphQlLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
