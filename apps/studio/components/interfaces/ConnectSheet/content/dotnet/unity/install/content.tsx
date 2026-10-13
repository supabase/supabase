import { CodeBlock } from 'ui-patterns/CodeBlock'

const nugetForUnityGitUrl =
  'https://github.com/GlitchEnzo/NuGetForUnity.git?path=/src/NuGetForUnity'

const InstallContent = () => {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <p className="text-sm text-foreground-light">
          Unity resolves NuGet packages through NuGetForUnity. Install it from the Package Manager
          via <span className="text-foreground">Add package from git URL</span>:
        </p>
        <CodeBlock
          className="[&_code]:text-foreground"
          value={nugetForUnityGitUrl}
          hideLineNumbers
          language="bash"
        >
          {nugetForUnityGitUrl}
        </CodeBlock>
      </div>
      <p className="text-sm text-foreground-light">
        Then open <span className="text-foreground">Window → NuGet → Manage NuGet Packages</span>,
        search for <span className="text-foreground">Supabase</span>, and install it. If you build
        with IL2CPP, preserve your model types from managed code stripping with a{' '}
        <span className="text-foreground">link.xml</span>.
      </p>
    </div>
  )
}

// Used as a dynamic import
export default InstallContent
