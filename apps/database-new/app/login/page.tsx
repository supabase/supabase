import LoginForm from '@/components/Auth/LoginForm'

export default function Login({ searchParams }: { searchParams: { message: string } }) {
  return <LoginForm searchParams={searchParams} />
}
