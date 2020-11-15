declare interface Credentials {
  email?: string | undefined
  password?: string | undefined
  provider?: 'bitbucket' | 'github' | 'gitlab' | 'google' | undefined
}
