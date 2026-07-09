import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-medium text-foreground">Sign-in link expired</h1>
      <p className="text-sm text-foreground-light">
        That link is no longer valid. Request a new one to sign in.
      </p>
      <Link href="/login" className="text-sm font-medium text-foreground underline">
        Back to sign in
      </Link>
    </div>
  )
}
