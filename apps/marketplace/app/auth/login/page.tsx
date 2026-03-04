import { LoginForm } from '@/components/login-form'

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <svg
          aria-label="Supabase"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[24px] w-[24px] mx-auto"
        >
          <path
            d="M12.7828 20.9736C12.2224 21.6713 11.0863 21.289 11.0728 20.3982L10.8754 7.36788H19.7364C21.3414 7.36788 22.2365 9.2008 21.2385 10.4437L12.7828 20.9736Z"
            fill="url(#paint0_linear_marketplace_header_logo)"
          />
          <path
            d="M12.7828 20.9736C12.2224 21.6713 11.0863 21.289 11.0728 20.3982L10.8754 7.36788H19.7364C21.3414 7.36788 22.2365 9.2008 21.2385 10.4437L12.7828 20.9736Z"
            fill="url(#paint1_linear_marketplace_header_logo)"
            fillOpacity="0.2"
          />
          <path
            d="M9.17895 0.00677839C9.7393 -0.69101 10.8754 -0.308673 10.8889 0.582223L10.9755 13.6125H2.22528C0.620264 13.6125 -0.274897 11.7795 0.72316 10.5367L9.17895 0.00677839Z"
            fill="#3ECF8E"
          />
          <defs>
            <linearGradient
              id="paint0_linear_marketplace_header_logo"
              x1="10.8754"
              y1="10.257"
              x2="18.7239"
              y2="13.5861"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#249361" />
              <stop offset="1" stopColor="#3ECF8E" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_marketplace_header_logo"
              x1="7.38382"
              y1="5.53017"
              x2="10.9125"
              y2="12.2482"
              gradientUnits="userSpaceOnUse"
            >
              <stop />
              <stop offset="1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="space-y-2 text-center">
          <h1 className="heading-title">Welcome back</h1>
          <p className="text-foreground-light">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
