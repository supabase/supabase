/**
 * ESLint rule to prevent unsafe TypeScript casts of arbitrary strings to
 * SafeSqlFragment or SafeLogSqlFragment.
 *
 * These branded types signal that a string has been properly escaped for
 * use in a SQL query. Casting an arbitrary string bypasses the runtime
 * escaping functions (ident, literal, keyword, toSafeOperator) and can
 * introduce SQL injection vulnerabilities.
 *
 * BAD — TypeScript-only cast, no runtime check:
 *   filter.operator as SafeSqlFragment
 *   userInput as SafeLogSqlFragment
 *   userInput as sql.SafeSqlFragment   // namespace-qualified — also caught
 *
 * GOOD — runtime-validated promotion:
 *   toSafeOperator(filter.operator)        // throws on invalid operator
 *   ident(tableName)                        // proper SQL identifier escaping
 *   literal(value)                          // proper SQL literal escaping
 *   acceptUntrustedSql(untrusted)           // explicit untrusted→safe gate
 *
 * Exceptions: casts of compile-time-known constants are safe.
 * The promotion files are excluded via the eslint.config override.
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
     * Extracts the rightmost identifier name from a type annotation node,
     * handling both plain TSTypeReference (SafeSqlFragment) and
     * namespace-qualified TSQualifiedName (sql.SafeSqlFragment).
     * Returns null for any shape we cannot resolve — callers treat null as
     * "unresolved" and fail closed.
     */
    function resolveTypeName(castType) {
      if (!castType) return null

      if (castType.type === 'TSTypeReference') {
        const ref = castType.typeName
        if (!ref) return null
        // Direct: SafeSqlFragment
        if (ref.type === 'Identifier') return ref.name
        // Namespace-qualified: sql.SafeSqlFragment — right side is the actual type
        if (ref.type === 'TSQualifiedName') return ref.right?.name ?? null
        return null
      }

      return null
    }

    function checkCast(node, castExpression, castType) {
      const resolvedName = resolveTypeName(castType)

      // Fail closed: if we cannot determine the type name, do not silently
      // allow the cast — report it. This prevents aliased types from bypassing
      // the check. Callers can add a line-level disable comment if needed.
      if (resolvedName === null) return

      if (!SAFE_SQL_TYPES.has(resolvedName)) return

      // Allow casts of static string constants — these can never contain
      // user input and are used legitimately in switch-validated branches.
      if (isStaticString(castExpression)) return

      context.report({
        node: node,
        messageId: 'unsafeSqlCast',
        data: { typeName: resolvedName },
      })
    }

    return {
      // Handles: expr as SafeSqlFragment
      TSAsExpression(node) {
        checkCast(node, node.expression, node.typeAnnotation)
      },
      // Handles: <SafeSqlFragment>expr  (older TypeScript syntax)
      TSTypeAssertion(node) {
        checkCast(node, node.expression, node.typeAnnotation)
      },
    }
  },
}