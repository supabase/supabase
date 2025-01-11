import Layout from '~/layouts/guides'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
