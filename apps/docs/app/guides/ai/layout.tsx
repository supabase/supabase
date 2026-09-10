import Layout from '~/layouts/guides'

export default async function AiLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
