import { auth } from 'lib/gotrue'
import { Button, IconGitHub } from 'ui'

const LoginWithGitHub = () => {
  async function handleGithubSignIn() {
    try {
      const { error } = await auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${
            process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
              ? process.env.NEXT_PUBLIC_VERCEL_URL
              : process.env.NEXT_PUBLIC_SITE_URL
          }/projects?auth=true`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Button block onClick={handleGithubSignIn} icon={<IconGitHub />} size="large" type="default">
      Continue with GitHub
    </Button>
  )
}

export default LoginWithGitHub
