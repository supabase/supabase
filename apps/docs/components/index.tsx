import { Button, Tabs, Alert, GlassPanel } from 'ui'
import Link from 'next/link'

// Common components
import Admonition from './Admonition'
import ButtonCard from './ButtonCard'
import CodeBlock from './CodeBlock/CodeBlock'
import { parseNumericRange } from './CodeBlock/CodeBlock.utils'
import JwtGenerator from './JwtGenerator'

// Page specific components
import Frameworks from './Frameworks'
import AuthProviders from './AuthProviders'
import FunctionsExamples from './FunctionsExamples'
import Extensions from './Extensions'

// Other components
import { Heading } from './CustomHTMLElements'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import ProjectSetup from './MDX/project_setup.mdx'
import SocialProviderSetup from './MDX/social_provider_setup.mdx'
import SocialProviderSettingsSupabase from './MDX/social_provider_settings_supabase.mdx'
import StorageManagement from './MDX/storage_management.mdx'
import { Mermaid } from 'mdx-mermaid/lib/Mermaid'
import InlineCodeTag from './CustomHTMLElements/InlineCode'
import React from 'react'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
// import { CH } from '@code-hike/mdx/components'
import RefHeaderSection from './reference/RefHeaderSection'

// Ref version specific
import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'

import Options from '~/components/Options'
import Param from '~/components/Params'
import Image from 'next/image'

const components = {
  Admonition,
  Button,
  ButtonCard,
  CodeBlock,
  GlassPanel,
  Link,
  Frameworks,
  AuthProviders,
  FunctionsExamples,
  JwtGenerator,
  QuickstartIntro,
  ProjectSetup,
  SocialProviderSetup,
  SocialProviderSettingsSupabase,
  StorageManagement,
  Mermaid,
  Extensions,
  Alert: (props: any) => (
    <Alert {...props} className="not-prose">
      {props.children}
    </Alert>
  ),
  Tabs,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  h2: (props: any) => (
    <Heading tag="h2" {...props}>
      {props.children}
    </Heading>
  ),
  h3: (props: any) => (
    <Heading tag="h3" {...props}>
      {props.children}
    </Heading>
  ),
  // pre: (props: any) => {
  //   const linesToHighlight = parseNumericRange(props.lines ?? '')
  //   return <CodeBlock {...props} linesToHighlight={linesToHighlight} />
  // },
  mono: (props: any) => <code className="text-sm">{props.children}</code>,
  // inlineCode: (props: { children: string }) => <InlineCodeTag {...props} />,
  RefSubLayout,
  // CH,
  code: (props: any) => <CodeBlock {...props} />,
  RefHeaderSection: (props: any) => <RefHeaderSection {...props} />,
  CliGlobalFlagsHandler: () => <CliGlobalFlagsHandler />,
  Options,
  Param,
  img: (props: any) => {
    return (
      <span className={['next-image--dynamic-fill'].join(' ')}>
        <Image {...props} className={['rounded-md border'].join(' ')} layout="fill" />
      </span>
    )
  },
}

export default components
