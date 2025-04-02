import { type PropsWithChildren } from 'react'
import { type BundledLanguage, codeToTokens, type ThemedToken } from 'shiki'
import { createTwoslasher, type ExtraFiles, type NodeHover } from 'twoslash'
import { cn } from 'ui'

import { AnnotatedSpan, CodeCopyButton } from './CodeBlock.client'
import denoTypes from './types/lib.deno.d.ts.include'

const extraFiles: ExtraFiles = { 'deno.d.ts': denoTypes }

const twoslasher = createTwoslasher({ extraFiles })
const TWOSLASHABLE_LANGS: ReadonlyArray<string> = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'javascript',
  'typescript',
]

export async function CodeBlock({
  className,
  lang: langSetting,
  lineNumbers = true,
  contents,
  children,
}: PropsWithChildren<{
  className?: string
  lang?: string
  lineNumbers?: boolean
  contents?: string
}>) {
  let code = (contents || extractCode(children)).trim()
  const lang = tryToBundledLanguage(langSetting) || extractLang(children)

  let twoslashed = null as null | Map<number, Map<number, Array<NodeHover>>>
  if (TWOSLASHABLE_LANGS.includes(lang)) {
    try {
      const { code: editedCode, nodes } = twoslasher(code)
      const hoverNodes: Array<NodeHover> = nodes.filter((node) => node.type === 'hover')
      twoslashed = annotationsByLine(hoverNodes)
      code = editedCode
    } catch (_err) {
      // Silently ignore, if imports aren't defined type compilation fails
    }
  }

  const { tokens } = await codeToTokens(code, {
    lang,
    themes: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
  })

  return (
    <div
      className={cn(
        'shiki',
        'group',
        'relative',
        'not-prose',
        'w-full overflow-hidden',
        'border border-default rounded-lg',
        'bg-200',
        'text-sm',
        className
      )}
    >
      <pre>
        <code className={lineNumbers ? 'flex' : ''}>
          {lineNumbers && (
            <div className="flex-shrink-0 select-none text-right text-muted bg-control py-6 px-2">
              {tokens.map((_, idx) => (
                <div key={idx} className="w-full">
                  {idx + 1}
                </div>
              ))}
            </div>
          )}
          <div className={cn('p-6 overflow-x-auto', lineNumbers ? 'flex-grow' : '')}>
            {tokens.map((line, idx) => (
              <CodeLine key={idx} tokens={line} twoslash={twoslashed?.get(idx)} />
            ))}
          </div>
        </code>
      </pre>
      <CodeCopyButton
        content={code.trim()}
        className="hidden group-hover:block absolute top-2 right-2"
      />
    </div>
  )
}

function CodeLine({
  tokens: rawTokens,
  twoslash,
}: {
  tokens: Array<ThemedToken>
  twoslash?: Map<number, Array<NodeHover>>
}) {
  let offset = 0
  const tokens = rawTokens.map((token) => {
    const newToken = { ...token, offset }
    offset += token.content.length
    return newToken
  })

  return (
    <span className="block h-5">
      {tokens.map((token) =>
        twoslash?.has(token.offset) ? (
          <AnnotatedSpan
            key={token.offset}
            token={token}
            annotations={twoslash.get(token.offset)!}
          />
        ) : (
          <span key={token.offset} style={token.htmlStyle}>
            {token.content}
          </span>
        )
      )}
    </span>
  )
}

function extractCode(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  const child = Array.isArray(children) ? children[0] : children
  if (!!child && typeof child === 'object' && 'props' in child) {
    const props = child.props
    if (!!props && typeof props === 'object' && 'children' in props) {
      const code = props.children
      if (typeof code === 'string') return code
    }
  }
  return ''
}

function extractLang(children: React.ReactNode): BundledLanguage | null {
  if (typeof children === 'string') return null
  const child = Array.isArray(children) ? children[0] : children
  if (!!child && typeof child === 'object' && 'props' in child) {
    const props = child.props
    if (!!props && typeof props === 'object' && 'className' in props) {
      const className = props.className
      if (typeof className === 'string') {
        const lang = className.split(' ').find((className) => className.startsWith('language-'))
        return lang ? tryToBundledLanguage(lang.replace('language-', '')) : null
      }
    }
  }
  return null
}

function annotationsByLine(nodes: Array<NodeHover>): Map<number, Map<number, Array<NodeHover>>> {
  const result = new Map()
  nodes.forEach((node) => {
    const line = node.line
    const char = node.character
    if (!result.has(line)) {
      result.set(line, new Map())
    }
    if (!result.get(line).has(char)) {
      result.get(line).set(char, [])
    }
    result.get(line).get(char).push(node)
  })
  return result
}

function tryToBundledLanguage(lang: string): BundledLanguage | null {
  if (BUNDLED_LANGUAGES.includes(lang)) {
    return lang as BundledLanguage
  }
  return null
}

const BUNDLED_LANGUAGES = [
  'abap',
  'actionscript-3',
  'ada',
  'adoc',
  'angular-html',
  'angular-ts',
  'apache',
  'apex',
  'apl',
  'applescript',
  'ara',
  'asciidoc',
  'asm',
  'astro',
  'awk',
  'ballerina',
  'bash',
  'bat',
  'batch',
  'be',
  'beancount',
  'berry',
  'bibtex',
  'bicep',
  'blade',
  'c',
  'c#',
  'c++',
  'cadence',
  'cdc',
  'clarity',
  'clj',
  'clojure',
  'closure-templates',
  'cmake',
  'cmd',
  'cobol',
  'codeowners',
  'codeql',
  'coffee',
  'coffeescript',
  'common-lisp',
  'console',
  'cpp',
  'cql',
  'crystal',
  'cs',
  'csharp',
  'css',
  'csv',
  'cue',
  'cypher',
  'd',
  'dart',
  'dax',
  'desktop',
  'diff',
  'docker',
  'dockerfile',
  'dream-maker',
  'elisp',
  'elixir',
  'elm',
  'emacs-lisp',
  'erb',
  'erl',
  'erlang',
  'f',
  'f#',
  'f03',
  'f08',
  'f18',
  'f77',
  'f90',
  'f95',
  'fennel',
  'fish',
  'fluent',
  'for',
  'fortran-fixed-form',
  'fortran-free-form',
  'fs',
  'fsharp',
  'fsl',
  'ftl',
  'gdresource',
  'gdscript',
  'gdshader',
  'genie',
  'gherkin',
  'git-commit',
  'git-rebase',
  'gjs',
  'gleam',
  'glimmer-js',
  'glimmer-ts',
  'glsl',
  'gnuplot',
  'go',
  'gql',
  'graphql',
  'groovy',
  'gts',
  'hack',
  'haml',
  'handlebars',
  'haskell',
  'haxe',
  'hbs',
  'hcl',
  'hjson',
  'hlsl',
  'hs',
  'html',
  'html-derivative',
  'http',
  'hxml',
  'hy',
  'imba',
  'ini',
  'jade',
  'java',
  'javascript',
  'jinja',
  'jison',
  'jl',
  'js',
  'json',
  'json5',
  'jsonc',
  'jsonl',
  'jsonnet',
  'jssm',
  'jsx',
  'julia',
  'kotlin',
  'kql',
  'kt',
  'kts',
  'kusto',
  'latex',
  'less',
  'liquid',
  'lisp',
  'log',
  'logo',
  'lua',
  'make',
  'makefile',
  'markdown',
  'marko',
  'matlab',
  'md',
  'mdc',
  'mdx',
  'mediawiki',
  'mermaid',
  'mojo',
  'move',
  'nar',
  'narrat',
  'nextflow',
  'nf',
  'nginx',
  'nim',
  'nix',
  'nu',
  'nushell',
  'objc',
  'objective-c',
  'objective-cpp',
  'ocaml',
  'pascal',
  'perl',
  'perl6',
  'php',
  'plsql',
  'po',
  'postcss',
  'pot',
  'potx',
  'powerquery',
  'powershell',
  'prisma',
  'prolog',
  'properties',
  'proto',
  'ps',
  'ps1',
  'pug',
  'puppet',
  'purescript',
  'py',
  'python',
  'ql',
  'qml',
  'qmldir',
  'qss',
  'r',
  'racket',
  'raku',
  'razor',
  'rb',
  'reg',
  'regex',
  'regexp',
  'rel',
  'riscv',
  'rs',
  'rst',
  'ruby',
  'rust',
  'sas',
  'sass',
  'scala',
  'scheme',
  'scss',
  'sh',
  'shader',
  'shaderlab',
  'shell',
  'shellscript',
  'shellsession',
  'smalltalk',
  'solidity',
  'soy',
  'sparql',
  'spl',
  'splunk',
  'sql',
  'ssh-config',
  'stata',
  'styl',
  'stylus',
  'svelte',
  'swift',
  'system-verilog',
  'systemd',
  'tasl',
  'tcl',
  'terraform',
  'tex',
  'tf',
  'tfvars',
  'toml',
  'ts',
  'tsp',
  'tsv',
  'tsx',
  'turtle',
  'twig',
  'typ',
  'typescript',
  'typespec',
  'typst',
  'v',
  'vala',
  'vb',
  'verilog',
  'vhdl',
  'vim',
  'viml',
  'vimscript',
  'vue',
  'vue-html',
  'vy',
  'vyper',
  'wasm',
  'wenyan',
  'wgsl',
  'wiki',
  'wikitext',
  'wl',
  'wolfram',
  'xml',
  'xsl',
  'yaml',
  'yml',
  'zenscript',
  'zig',
  'zsh',
  '文言',
]
