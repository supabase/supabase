import { createRequire } from 'node:module'
import { Linter } from 'eslint'
import { JsxEmit, ModuleKind, transpileModule } from 'typescript'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const rule = require('../rules/wrap-jsx-text')
const parser = require('@typescript-eslint/parser')

function lint(code: string) {
  const linter = new Linter()
  const config = {
    files: ['**/*.tsx'],
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { supabase: { rules: { 'wrap-jsx-text': rule } } },
    rules: { 'supabase/wrap-jsx-text': 'warn' as const },
  }
  return {
    originalMessages: linter.verify(code, config, { filename: 'fixture.tsx' }),
    ...linter.verifyAndFix(code, config, { filename: 'fixture.tsx' }),
  }
}

function jsxText(code: string) {
  const transformed = transpileModule(`const result = ${code}`, {
    compilerOptions: { jsx: JsxEmit.React, module: ModuleKind.None },
  }).outputText
  const React = {
    Fragment: 'fragment',
    createElement: (_tag: string, _props: null, ...children: (string | string[])[]) =>
      children.flat(),
  }
  return new Function('React', `${transformed}; return result.flat(Infinity).join('')`)(React)
}

describe('wrap-jsx-text', () => {
  it.each([
    ['<div>Hello</div>', '<div><span>Hello</span></div>'],
    ['<button>{"Save"}</button>', '<button>{<span>{"Save"}</span>}</button>'],
    ['<div>{`Hello ${name}`}</div>', '<div>{<span>{`Hello ${name}`}</span>}</div>'],
    ['<div>{show && "Hello"}</div>', '<div>{show && <span>{"Hello"}</span>}</div>'],
    [
      '<div>{show ? "Yes" : "No"}</div>',
      '<div>{show ? <span>{"Yes"}</span> : <span>{"No"}</span>}</div>',
    ],
    [
      '<div>{a && (b ? "Yes" : "No")}</div>',
      '<div>{a && (b ? <span>{"Yes"}</span> : <span>{"No"}</span>)}</div>',
    ],
    ['<div>{show ? "Yes" : null}</div>', '<div>{show ? <span>{"Yes"}</span> : null}</div>'],
    ['<div>{show ? false : "No"}</div>', '<div>{show ? false : <span>{"No"}</span>}</div>'],
    ['<div><>Hello</></div>', '<div><><span>Hello</span></></div>'],
    ['<div>{show && <>Hello</>}</div>', '<div>{show && <><span>Hello</span></>}</div>'],
    ['<span>Hello {name}</span>', '<span><span>Hello </span>{name}</span>'],
    ['<span>{show && "Hello"}</span>', '<span>{show && <span>{"Hello"}</span>}</span>'],
    ['<span><>Hello {name}</></span>', '<span><><span>Hello </span>{name}</></span>'],
  ])('fixes %s and remains stable', (input, output) => {
    const result = lint(input)
    expect(result.output).toBe(output)
    expect(result.fixed).toBe(true)
    expect(result.originalMessages.length).toBeGreaterThan(0)
    expect(result.originalMessages.every((message) => message.messageId === 'wrap')).toBe(true)
    expect(result.messages).toEqual([])
    expect(lint(result.output).fixed).toBe(false)
  })

  it.each([
    '<span>Hello</span>',
    '<span>{"Hello"}</span>',
    '<span>{`Hello ${name}`}</span>',
    '<span>{show ? "Yes" : "No"}</span>',
    '<div>{value}</div>',
    '<div>{getLabel()}</div>',
    '<div>{42}</div>',
    '<div>{true}</div>',
    '<div>{null}</div>',
    '<div>{""}</div>',
    '<div>{``}</div>',
    '<div>\n  \n</div>',
    '<div> </div>',
    '<div title="Hello" />',
    '<><span>Hello</span><span>World</span></>',
    '<svg><text>Hello</text><foreignObject><div>Hello</div></foreignObject></svg>',
    '<math><mtext>Hello</mtext></math>',
    '<svg:text>Hello</svg:text>',
    '<table>Hello</table>',
    '<select><option>Hello</option></select>',
    '<textarea>Hello</textarea>',
    '<style>{"Hello"}</style>',
    '<script>{"Hello"}</script>',
    '<title>Hello</title>',
    '<pre>Hello</pre>',
    '<code>Hello</code>',
    '<ul>Hello</ul>',
    '<picture>Hello</picture>',
    '<Button asChild><div>Hello</div></Button>',
    '<Slot><div>Hello</div></Slot>',
    '<Primitive.Slot><div>Hello</div></Primitive.Slot>',
  ])('leaves protected or unsupported text unchanged: %s', (input) => {
    const result = lint(input)
    expect(result.messages).toEqual([])
    expect(result.fixed).toBe(false)
  })

  it.each([
    '<div className="flex">Hello</div>',
    '<div style={{ display: "grid" }}>Hello</div>',
    '<div {...props}>Hello</div>',
    '<div id="label">Hello</div>',
    '<div className="[&_*]:flex"><p>Hello</p></div>',
    '<Slot.Root><div>Hello</div></Slot.Root>',
    '<Alias><div>Hello</div></Alias>',
    '<Button>Hello</Button>',
    '<Dialog.Title>Hello</Dialog.Title>',
    '<custom-element>Hello</custom-element>',
    '<div>{show ? "Hello" : <Icon />}</div>',
    '<div>{show ? "Hello" : unknown}</div>',
    '<div>{show ? "Hello" : 0}</div>',
    '<div>{show ? "Hello" : getLabel()}</div>',
  ])('reports without a fix when safety needs review: %s', (input) => {
    const result = lint(input)
    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].messageId).toBe('review')
    expect(result.messages[0].fix).toBeUndefined()
    expect(result.output).toBe(input)
  })

  it('keeps mixed React element branches for manual review', () => {
    const input = '<div>{show ? "Hello" : <b>Bye</b>}</div>'
    const result = lint(input)
    expect(result.output).toBe(input)
    expect(result.messages.map((message) => message.messageId)).toEqual(['review', 'review'])
  })

  it.each([
    '<div> Hello <b /> world </div>',
    '<div>\n  Hello\n  world\n</div>',
    '<div>hello\n  world <b /> again\n</div>',
    '<div>\tHello\tworld\t</div>',
    '<div>\n\n Hello\n\n world\n\n</div>',
    '<div>Hello &amp; goodbye&nbsp;&#x1F44B;</div>',
    '<div>\r\n Hello\r\n world\r\n</div>',
    '<div>{" "}Hello{" "}</div>',
  ])('preserves JSX text semantics: %s', (input) => {
    const output = lint(input).output
    expect(output).not.toBe(input)
    expect(jsxText(output)).toBe(jsxText(input))
  })
})
