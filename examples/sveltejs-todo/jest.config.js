// as of 2020-10-03 default config hangs

const config = { ...require('@snowpack/app-scripts-svelte/jest.config.js')() }
// change default config to use svelte-jester

config.transform['^.+\\.svelte$'][0] = 'svelte-jester'
// optional output transformed file for debugging

// config.transform["^.+\\.svelte$"][1]["debug"]=true

// add setuphelper

// config.setupFilesAfterEnv.push('<rootDir>/src/_testHelper.js')

module.exports = {
  ...config,
}

// // changes to snowpack to fix testing with svelte

// once below changes tests can be run without babel/jest

// // https://github.com/pikapkg/snowpack/issues/1036
// // https://github.com/pikapkg/snowpack/issues/703

// // https://github.com/rspieker/jest-transform-svelte#18
// // https://github.com/pikapkg/snowpack/discussions/753
// // https://github.com/facebook/jest/issues/9430
// // c.f https://stackoverflow.com/questions/63091947/jest-hangs-when-svelte-configuration-includes-svelte-preprocess
