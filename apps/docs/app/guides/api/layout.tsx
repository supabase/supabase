import Layout from '~/layouts/guides'

export default async function ApiLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
