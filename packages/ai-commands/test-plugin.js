module.exports = function ({ types: t }) {
  console.log('got here 2')
  return {
    visitor: {
      FunctionDeclaration(path) {
        // Check if there's a comment with "@static-build" directly above the function
        if (
          path.node.leadingComments &&
          path.node.leadingComments.some((comment) => comment.value.includes('@static-build'))
        ) {
          console.log('in plugin 2', path.toString())
          try {
            // Assuming the function is synchronous for simplicity
            const result = eval(`(${path.toString()})()`)

            // Replace the original function with a function returning the cached result
            path.replaceWith(
              t.functionDeclaration(
                path.node.id,
                [],
                t.blockStatement([t.returnStatement(t.valueToNode(result))]),
                path.node.generator,
                path.node.async
              )
            )

            // Filter out the '@static-build' comment to prevent re-processing
            path.node.leadingComments = path.node.leadingComments.filter(
              (comment) => !comment.value.includes('@static-build')
            )
          } catch (error) {
            console.error('Error executing static function:', error)
          }
        }
      },
    },
  }
}
console.log('got here')
