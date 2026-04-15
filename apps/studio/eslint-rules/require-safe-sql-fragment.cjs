/**
 * ESLint rule to require SafeSqlFragment (not a plain string) for the sql argument of executeSql.
 *
 * During migration, executeSql still accepts string (a supertype of SafeSqlFragment), but new
 * call sites should use SafeSqlFragment to avoid SQL injection risks and to be ready for when
 * the type is tightened.
 *
 * BAD:
 *   executeSql({ projectRef, sql: `SELECT * FROM ${table}` })
 *   const query = buildQuery()  // returns string
 *   executeSql({ projectRef, sql: query })
 *
 * GOOD:
 *   executeSql({ projectRef, sql: safeSql`SELECT * FROM ${ident(table)}` })
 *   executeSql({ projectRef, sql: keyword('SELECT 1') })
 */

const { ESLintUtils } = require('@typescript-eslint/utils')

/** @type {import('@typescript-eslint/utils').TSESLint.RuleModule<'requireSafeSqlFragment'>} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require executeSql to be called with SafeSqlFragment, not a plain string. Use safeSql`...`, ident(), literal(), or keyword() to create a SafeSqlFragment.',
      recommended: true,
    },
    messages: {
      requireSafeSqlFragment:
        'The sql argument to executeSql must be SafeSqlFragment, not a plain string. Use safeSql`...`, ident(), literal(), or keyword() to construct it safely.',
    },
    schema: [],
  },

  create(context) {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    return {
      CallExpression(node) {
        const callee = node.callee
        const isExecuteSql =
          (callee.type === 'Identifier' && callee.name === 'executeSql') ||
          (callee.type === 'MemberExpression' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'executeSql')

        if (!isExecuteSql) return

        const firstArg = node.arguments[0]
        if (!firstArg || firstArg.type !== 'ObjectExpression') return

        const sqlProp = firstArg.properties.find(
          (prop) =>
            prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'sql'
        )
        if (!sqlProp || sqlProp.type !== 'Property') return

        const tsNode = services.esTreeNodeToTSNodeMap.get(sqlProp.value)
        const type = checker.getTypeAtLocation(tsNode)
        const hasBrand = checker.getPropertyOfType(type, '__safeSqlFragmentBrand') !== undefined

        if (!hasBrand) {
          context.report({ node: sqlProp.value, messageId: 'requireSafeSqlFragment' })
        }
      },
    }
  },
}
