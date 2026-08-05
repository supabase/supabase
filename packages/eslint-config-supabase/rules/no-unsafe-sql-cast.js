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
 *
 * GOOD — runtime-validated promotion:
 *   toSafeOperator(filter.operator)        // throws on invalid operator
 *   ident(tableName)                        // proper SQL identifier escaping
 *   literal(value)                          // proper SQL literal escaping
 *   acceptUntrustedSql(untrusted)           // explicit untrusted→safe gate
 *
 * Exceptions: casts of compile-time-known constants are safe.
 * The two promotion files (safe-analytics-sql.ts, Query.utils.ts) are
 * excluded from this rule via the eslint.config.cjs override.
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
     * Checks both TypeScript `as` expressions (TSTypeAssertion in newer
     * parsers) and angle-bracket casts.
     */
    function checkCast(node, castExpression, castType) {
      const typeName =
        castType.typeName?.name ?? castType.type?.name ?? castType.typeParameters?.type

      // Resolve the actual type name from TSTypeReference
      let resolvedName = null
      if (castType.type === 'TSTypeReference') {
        resolvedName = castType.typeName?.name
      } else if (castType.typeName) {
        resolvedName = castType.typeName.name
      }

      if (!resolvedName || !SAFE_SQL_TYPES.has(resolvedName)) return

      // Allow casts of static string constants — these can never contain
      // user input and are used legitimately in `switch`-validated branches.
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
