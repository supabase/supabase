const changeCase = require('change-case')

module.exports = name => changeCase.camelCase(name, { transform: changeCase.camelCaseTransformMerge })
