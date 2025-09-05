import fs from 'fs'
import { template } from 'lodash'
import path from 'path'
import * as prettier from 'prettier'
import { type RegistryItem } from 'shadcn/schema'

const SOCIAL_PROVIDERS = [
  { label: 'Password', value: 'password' },
  { label: 'Google', value: 'google' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Apple', value: 'apple' },
  { label: 'Azure (Microsoft)', value: 'azure' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'GitHub', value: 'github' },
  { label: 'Gitlab', value: 'gitlab' },
  { label: 'Bitbucket', value: 'bitbucket' },
  { label: 'Discord', value: 'discord' },
  { label: 'Figma', value: 'figma' },
  { label: 'Kakao', value: 'kakao' },
  { label: 'Keycloak', value: 'keycloak' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Notion', value: 'notion' },
  { label: 'Slack', value: 'slack' },
  { label: 'Spotify', value: 'spotify' },
  { label: 'Twitch', value: 'twitch' },
  { label: 'WorkOS', value: 'workos' },
  { label: 'Zoom', value: 'zoom' },
]

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const slug = (await params).slug.replace('.json', '')
    const parts = slug.split('-')

    let [framework, ...authTypes] = parts

    // Build block names
    const passwordBlockName = `password-based-auth-${framework}`
    const socialBlockName = `social-auth-${framework}`

    const blocksDir = path.join(process.cwd(), 'public', 'r')

    const blocks: RegistryItem[] = []
    const imports: string[] = []
    const components: string[] = []

    const commonBlockPath = path.join(blocksDir, `common-auth-nextjs.json`)
    const commonBlock: RegistryItem = JSON.parse(fs.readFileSync(commonBlockPath, 'utf-8'))
    blocks.push(commonBlock)

    if (authTypes.includes('password')) {
      // Read the base auth block
      const baseBlockPath = path.join(blocksDir, `${passwordBlockName}.json`)
      if (!fs.existsSync(baseBlockPath)) {
        return Response.json(
          { error: `Base block not found: ${passwordBlockName}` },
          { status: 404 }
        )
      }
      const baseBlock: RegistryItem = JSON.parse(fs.readFileSync(baseBlockPath, 'utf-8'))
      blocks.push(baseBlock)
      imports.push(
        "import { PasswordLoginForm } from '@/registry/default/blocks/password-based-auth-nextjs/components/password-login-form'"
      )
      components.push('<PasswordLoginForm />')
      if (authTypes.length > 1) {
        components.push(
          `<div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border" /></div><div className="relative flex justify-center text-sm"><span className="px-2 text-sm bg-background text-foreground">or</span></div></div>`
        )
      }
    }

    for (let authType of authTypes) {
      if (authType === 'password') {
        // Already handled above
        continue
      }
      const provider = SOCIAL_PROVIDERS.find((p) => p.value === authType)
      if (!provider) {
        return Response.json({ error: `Unknown auth type: ${authType}` }, { status: 400 })
      }

      const socialBlockPath = path.join(blocksDir, `${socialBlockName}.json`)
      const socialBlock: RegistryItem = JSON.parse(fs.readFileSync(socialBlockPath, 'utf-8'))
      blocks.push(socialBlock)
      if (imports.find((imp) => imp.includes('SocialLoginButton')) === undefined) {
        imports.push(
          "import { SocialLoginButton } from '@/registry/default/blocks/social-auth-nextjs/components/social-login-button'"
        )
      }

      components.push(
        `<SocialLoginButton label="${provider.label}" provider="${provider.value}" />`
      )
    }

    // Create combined block
    const combinedBlock: RegistryItem = {
      name: slug,
      type: 'registry:block',
      title: `Combined Auth with ${authTypes.join(', ')} for ${framework}`,
      description: `Combined authentication flow with password-based auth and ${authTypes.join(', ')} social providers for ${framework}`,
      registryDependencies: Array.from(
        new Set(blocks.flatMap((b) => b.registryDependencies || []))
      ),
      dependencies: Array.from(new Set(blocks.flatMap((b) => b.dependencies || []))),
      files: blocks.flatMap((b) => b.files || []),
    }

    const loginForm = combinedBlock.files?.find((f) => f.path.endsWith('app/auth/login/page.tsx'))
    if (loginForm) {
      const compiled = template(loginForm.content, { interpolate: /{?\/\*<%=(.+?)%> \*\/}?/g })
      const templated = compiled({
        imports: imports.join('\n'),
        components: components.join(''),
      })
      const content = await prettier.format(templated, { parser: 'typescript' } as prettier.Options)
      loginForm.content = content
    }

    return Response.json(combinedBlock, { status: 200 })
  } catch (error) {
    console.error('Error processing block request:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
