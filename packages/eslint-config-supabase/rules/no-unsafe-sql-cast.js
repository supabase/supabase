/**
 * ESLint rule to prevent unsafe TypeScript casts of arbitrary strings to
 * SafeSqlFragment or SafeLogSqlFragment.
 *
 * These branded types signal that a string has been properly escaped for
 * use in a SQL query. Casting an arbitrary string bypasses the runtime
 * escaping functions (ident, literal, keyword, toSafeOperator) and can
 * introduce SQL injection vulnerabilities.
 *
 * Caught patterns:
 *   value as SafeSqlFragment              — direct cast
 *   value as sql.SafeSqlFragment          — namespace-qualified cast
 *   value as SafeSqlFragment & Extra      — intersection type containing SQL brand
 *
 * Known limitation: type alias resolution (type X = SafeSqlFragment) requires
 * the TypeScript type-checker API (parser services). This rule operates on the
 * AST spelling only. Add a // eslint-disable-next-line comment at any legitimate
 * alias-promotion site and document why.
 *
 * Exempt: casts of compile-time string literals (cannot contain user input).
 * Exempt files: see override in eslint.config/next.js.
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow casting arbitrary strings to SafeSqlFragment or SafeLogSqlFragment without runtime validation',
      recommended: true,
    },
    messages: {
      unsafeSqlCast:
        'Do not cast directly to {{typeName}} — use ident(), literal(), toSafeOperator(), or acceptUntrustedSql() instead. Direct casts bypass runtime escaping and can introduce SQL injection.',
      unresolvedCast:
        'Cannot resolve this cast target — if it aliases SafeSqlFragment or SafeLogSqlFragment, use a runtime escaping function instead.',
    },
    schema: [],
  },

  create(context) {
    const SAFE_SQL_TYPES = new Set(['SafeSqlFragment', 'SafeLogSqlFragment'])

    /**
     * Returns true if the expression is a simple string literal or template
     * literal with no substitutions — these are compile-time constants and
     * safe to cast (they cannot contain user input).
     */
    function isStaticString(node) {
      if (node.type === 'Literal' && typeof node.value === 'string') return true
      if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return true
      return false
    }

    /**
     * Extracts the terminal type name from a TSTypeReference node.
     * Returns the name string, or null if the shape cannot be read.
     *
     * Handles:
     *   SafeSqlFragment          → 'SafeSqlFragment'  (Identifier)
     *   sql.SafeSqlFragment      → 'SafeSqlFragment'  (TSQualifiedName — right side)
     */
    function resolveTypeName(castType) {
      if (!castType || castType.type !== 'TSTypeReference') return null
      const ref = castType.typeName
      if (!ref) return null
      if (ref.type === 'Identifier') return ref.name
      if (ref.type === 'TSQualifiedName') return ref.right?.name ?? null
      return null
    }

    /**
     * Core check applied to both TSAsExpression and TSTypeAssertion.
     *
     * Strategy:
     *  1. Intersection types (A & B): flag if any member resolves to a SQL brand.
     *  2. TSTypeReference where name resolves to a known SQL brand: flag.
     *  3. TSTypeReference where name cannot be read: fail closed and flag —
     *     an alias for SafeSqlFragment would look identical at the AST level.
     *  4. Everything else (plain non-SQL types, union types, etc.): pass.
     */
    function checkCast(node, castExpression, castType) {
      if (!castType) return

      // ── Intersection types: SafeSqlFragment & SomeExtra ──────────────────
      if (castType.type === 'TSIntersectionType') {
        const sqlMember = castType.types
          .map(t => resolveTypeName(t))
          .find(name => name !== null && SAFE_SQL_TYPES.has(name))
        if (!sqlMember) return
        if (isStaticString(castExpression)) return
        context.report({ node, messageId: 'unsafeSqlCast', data: { typeName: sqlMember } })
        return
      }

      // ── Plain or namespace-qualified TSTypeReference ──────────────────────
      if (castType.type === 'TSTypeReference') {
        const resolvedName = resolveTypeName(castType)

        if (resolvedName === null) {
          // The type reference has a shape we cannot read. Fail closed: report
          // rather than silently allow, since it could be an alias for a SQL brand.
          // This is intentionally conservative; add a disable comment with an
          // explanation if the site is genuinely safe.
          if (isStaticString(castExpression)) return
          context.report({ node, messageId: 'unresolvedCast' })
          return
        }

        if (!SAFE_SQL_TYPES.has(resolvedName)) return
        if (isStaticString(castExpression)) return
        context.report({ node, messageId: 'unsafeSqlCast', data: { typeName: resolvedName } })
      }
    }

    return {
      // expr as SafeSqlFragment
      TSAsExpression(node) {
        checkCast(node, node.expression, node.typeAnnotation)
      },
      // <SafeSqlFragment>expr  (older TypeScript syntax)
      TSTypeAssertion(node) {
        checkCast(node, node.expression, node.typeAnnotation)
      },
    }
  },
}