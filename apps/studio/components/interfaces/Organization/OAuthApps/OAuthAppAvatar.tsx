export function OAuthAppAvatar({ name, icon }: { name: string; icon?: string | null }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-control bg-cover bg-center bg-no-repeat text-xs"
      style={{ backgroundImage: icon ? `url('${icon}')` : 'none' }}
    >
      {icon ? null : name[0]}
    </div>
  )
}
