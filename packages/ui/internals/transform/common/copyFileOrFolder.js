const fs = require('fs-extra')

module.exports = {
  do: function (dictionary, config) {
    config.options.copyFilesAction.forEach(({ destination, origin }) => {
      console.log(`Copying ${origin} to ${destination}`)
      fs.copySync(origin, destination)
    })
  },
  undo: function (dictionary, config) {
    config.options.copyFilesAction.forEach(({ destination, origin }) => {
      console.log(`Cleaning ${destination}`)
      fs.removeSync(destination)
    })
  }
}
