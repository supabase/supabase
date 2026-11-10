/**
 * Lint rules for endpoint-bound FGA grants (see data/guarded-fetch.ts).
 *
 * - `no-unguarded-migrating` marks call sites not yet migrated.
 * - `unguarded-by-design-reason` requires a non-empty string-literal reason.
 * - `no-fetch-type-bypass` flags calls that skip the typed fetch wrappers' grant check.
 * - `no-spread-granted-query-options` flags spreading (or `Object.assign`-ing) the result of
 *   `grantedQueryOptions`, which would let the caller override the grant gate. It is type-aware:
 *   it detects the type-only brand on the value, so it needs `parserOptions.projectService`.
 */

const path = require('node:path')

const TYPED_FETCH_METHODS = new Set(['get', 'post', 'put', 'patch', 'del'])
const UNTYPED_FETCH_HELPERS = new Set(['fetchGet', 'fetchPost'])
const TS_LINE_DIRECTIVE = /@ts-(expect-error|ignore)\b/
const TS_FILE_DIRECTIVE = /@ts-nocheck\b/

/** @param {import('estree').Node} node */
function isUnguardedMember(node, property) {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object.type === 'Identifier' &&
    node.object.name === 'unguarded' &&
    node.property.type === 'Identifier' &&
    node.property.name === property
  )
}

/**
 * @param {string} source
 * @param {string} filename
 */
function isFetchersModule(source, filename) {
  if (source === '@/data/fetchers') return true
  if (!source.startsWith('.')) return false
  const resolved = path.resolve(path.dirname(filename), source).split(path.sep).join('/')
  return resolved.endsWith('/data/fetchers')
}

/** @type {import('eslint').Rule.RuleModule} */
const noUnguardedMigrating = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Track call sites not yet migrated to FGA grants' },
    messages: {
      migrating:
        'Pass a grant from useGrant/getGrant/ensureGrant instead of `unguarded.migrating`. New call sites must not add to the migration backlog.',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (isUnguardedMember(node, 'migrating')) context.report({ node, messageId: 'migrating' })
      },
    }
  },
}

/** @type {import('eslint').Rule.RuleModule} */
const unguardedByDesignReason = {
  meta: {
    type: 'problem',
    docs: { description: 'Require a non-empty string-literal reason for `unguarded.byDesign`' },
    messages: {
      reason:
        'Pass `unguarded.byDesign` a single non-empty string literal explaining why this call skips the grant check.',
    },
    schema: [],
  },
  create(context) {
    /** @param {import('estree').Node | undefined} arg */
    function hasLiteralReason(arg) {
      if (!arg) return false
      if (arg.type === 'Literal') return typeof arg.value === 'string' && arg.value.trim() !== ''
      if (arg.type === 'TemplateLiteral') {
        return arg.expressions.length === 0 && arg.quasis[0].value.cooked.trim() !== ''
      }
      return false
    }

    return {
      MemberExpression(node) {
        if (!isUnguardedMember(node, 'byDesign')) return
        const call = node.parent
        const isCalled = call.type === 'CallExpression' && call.callee === node
        if (!isCalled || call.arguments.length !== 1 || !hasLiteralReason(call.arguments[0])) {
          context.report({ node: isCalled ? call : node, messageId: 'reason' })
        }
      },
    }
  },
}

/** @type {import('eslint').Rule.RuleModule} */
const noFetchTypeBypass = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow bypassing the typed fetch wrappers and their grant checks' },
    messages: {
      tsDirective:
        'Do not suppress type errors on a call to `{{name}}` from data/fetchers. The types enforce the FGA grant; fix the call instead.',
      untypedFetch:
        '`{{name}}` is untyped and skips the FGA grant check. Use get/post/put/patch/del from data/fetchers instead.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    /** @type {Map<string, string>} local name -> imported name */
    const typedMethods = new Map()
    /**
     * Typed fetch calls, keyed by the lines where a suppressed type error would hide a missing
     * or wrong grant: the call's first line, each argument's first line, and the `grant` property.
     * @type {{ name: string, lines: Set<number> }[]}
     */
    const typedCalls = []

    /** TS line directives apply to the next line that isn't only a comment. */
    function directiveTarget(comment) {
      let line = comment.loc.end.line + 1
      while (
        line <= sourceCode.lines.length &&
        /^\s*(\/\/|\/\*|\*)/.test(sourceCode.lines[line - 1])
      ) {
        line += 1
      }
      return line
    }

    return {
      ImportDeclaration(node) {
        if (!isFetchersModule(String(node.source.value), context.filename)) return
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue
          const imported =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : String(specifier.imported.value)
          if (TYPED_FETCH_METHODS.has(imported)) typedMethods.set(specifier.local.name, imported)
          if (UNTYPED_FETCH_HELPERS.has(imported)) {
            context.report({ node: specifier, messageId: 'untypedFetch', data: { name: imported } })
          }
        }
      },
      CallExpression(node) {
        if (node.callee.type !== 'Identifier') return
        const imported = typedMethods.get(node.callee.name)
        if (!imported) return
        const lines = new Set([node.loc.start.line, ...node.arguments.map((a) => a.loc.start.line)])
        const init = node.arguments[1]
        if (init?.type === 'ObjectExpression') {
          for (const property of init.properties) {
            const isGrant =
              property.type === 'Property' &&
              !property.computed &&
              property.key.type === 'Identifier' &&
              property.key.name === 'grant'
            if (isGrant) lines.add(property.loc.start.line)
          }
        }
        typedCalls.push({ name: imported, lines })
      },
      'Program:exit'() {
        if (typedCalls.length === 0) return
        for (const comment of sourceCode.getAllComments()) {
          let call
          if (TS_FILE_DIRECTIVE.test(comment.value)) {
            call = typedCalls[0]
          } else if (TS_LINE_DIRECTIVE.test(comment.value)) {
            const target = directiveTarget(comment)
            call = typedCalls.find(({ lines }) => lines.has(target))
          }
          if (call) {
            context.report({
              loc: comment.loc,
              messageId: 'tsDirective',
              data: { name: call.name },
            })
          }
        }
      },
    }
  },
}

/**
 * Name of the type-only optional property `grantedQueryOptions` adds to its return type
 * (`GrantedQueryOptionsBrand` in data/granted-query-options.ts). Keep the two in sync.
 */
const GRANTED_QUERY_OPTIONS_BRAND = '__grantedQueryOptions'

/** @type {import('eslint').Rule.RuleModule} */
const noSpreadGrantedQueryOptions = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow spreading grant-gated query options (requires type information)',
    },
    messages: {
      spread:
        'Pass query options as the second argument. Spreading lets callers override the grant gate.',
    },
    schema: [],
  },
  create(context) {
    const services = context.sourceCode.parserServices
    if (!services?.program || !services.esTreeNodeToTSNodeMap) {
      throw new Error(
        'fga/no-spread-granted-query-options requires type information: enable `parserOptions.projectService` for the linted files.'
      )
    }
    const checker = services.program.getTypeChecker()

    function isBranded(node) {
      const type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node))
      const constituents = type.isUnion() ? type.types : [type]
      return constituents.some((t) => checker.getPropertyOfType(t, GRANTED_QUERY_OPTIONS_BRAND))
    }

    return {
      SpreadElement(node) {
        if (node.parent.type !== 'ObjectExpression') return
        if (isBranded(node.argument)) context.report({ node, messageId: 'spread' })
      },
      CallExpression(node) {
        const { callee } = node
        const isObjectAssign =
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Object' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'assign'
        if (!isObjectAssign) return
        const args = node.arguments.map((arg) =>
          arg.type === 'SpreadElement' ? arg.argument : arg
        )
        if (args.some(isBranded)) context.report({ node, messageId: 'spread' })
      },
    }
  },
}

module.exports = {
  meta: { name: 'fga' },
  rules: {
    'no-unguarded-migrating': noUnguardedMigrating,
    'unguarded-by-design-reason': unguardedByDesignReason,
    'no-fetch-type-bypass': noFetchTypeBypass,
    'no-spread-granted-query-options': noSpreadGrantedQueryOptions,
  },
}
