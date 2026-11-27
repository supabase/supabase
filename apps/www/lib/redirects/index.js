// All www redirects: one-to-one entries first, then entries with params, splats, or conditions.
// Order matters because Next serves the first matching rule. See README.md in this folder.
const staticRedirects = require('./static-redirects.json')
const dynamicRedirects = require('./dynamic-redirects.js')

module.exports = [...staticRedirects, ...dynamicRedirects]
