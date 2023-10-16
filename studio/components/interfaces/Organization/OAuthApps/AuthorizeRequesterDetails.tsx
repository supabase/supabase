export interface AuthorizeRequesterDetailsProps {
  icon: string | null
  name: string
  domain: string
}

const AuthorizeRequesterDetails = ({ icon, name, domain }: AuthorizeRequesterDetailsProps) => {
  return (
    <div className="flex space-x-4">
      <div>
        <div className="flex items-center">
          <div
            className="w-14 h-14 md:w-16 md:h-16 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-md border border-scale-600"
            style={{
              backgroundImage: icon !== null ? `url('${icon}')` : 'none',
            }}
          >
            {icon === null && <p className="text-foreground-light text-lg">{name[0]}</p>}
          </div>
        </div>
      </div>
      <p className="text-sm text-foreground-light">
        {name} ({domain}) is requesting API access to an organization. The application will be able
        to{' '}
        <span className="text-amber-1200">
          read and write the organization's settings and all of its projects.
        </span>
      </p>
    </div>
  )
}

export default AuthorizeRequesterDetails
