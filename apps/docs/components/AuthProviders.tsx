import providers from '../data/authProviders'
import { IconLinkImage, IconLinkList } from '@/features/ui/IconLink'

export default function AuthProviders({
  type,
  labelledBy,
  label,
}: {
  type: string
  labelledBy?: string
  label?: string
}) {
  const items = providers
    .filter((item) => item.authType === type)
    .map((provider) => ({
      title: provider.name,
      href: provider.href,
      icon: <IconLinkImage path={provider.logo} hasLightIcon={provider.hasLightIcon} />,
    }))

  return (
    <IconLinkList
      labelledBy={labelledBy}
      label={label}
      className="not-prose py-8"
      itemClassName="col-span-12 xs:col-span-6 lg:col-span-4 xl:col-span-3"
      items={items}
    />
  )
}
