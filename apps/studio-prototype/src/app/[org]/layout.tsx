import SideNav from './side-nav'
import TopHeader from './top-header'

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="w-screen h-screen flex">
      <SideNav />
      <div className="flex flex-col grow">
        <TopHeader />
        <div>{children}</div>
      </div>
    </div>
  )
}
