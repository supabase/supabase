import Layout from '~/layouts/guides'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}
