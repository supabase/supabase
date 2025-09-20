import Layout from '~/layouts/guides'

export default async function UILayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
