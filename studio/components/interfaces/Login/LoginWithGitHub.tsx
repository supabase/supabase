import { auth } from 'lib/gotrue'
import { Button, IconGitHub } from 'ui'

const LoginWithGitHub = () => {
  async function handleGithubSignIn() {
    try {
      const { error } = await auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/projects?auth=true`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Button onClick={handleGithubSignIn} icon={<IconGitHub />} size="medium">
      Continue with GitHub
    </Button>
  )
}

export default LoginWithGitHub
