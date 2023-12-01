import LoginForm from '@/components/Auth/LoginForm'

export default function Login({ searchParams }: { searchParams: { message: string } }) {
  return (
    <main role="main" className="h-[calc(100vh-115px)] w-full flex flex-col grow">
      <LoginForm searchParams={searchParams} />
    </main>
  )
}
