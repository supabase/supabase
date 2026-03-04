import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="heading-title">Check your email</h1>
          <p className="text-foreground-light">
            We sent a confirmation link to your inbox. Confirm your account to continue.
          </p>
        </div>
        <div className="text-sm">
          <Link
            href="/auth/login"
            className="underline transition text-foreground hover:text-muted-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
