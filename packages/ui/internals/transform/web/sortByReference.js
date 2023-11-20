/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

/**
 * A function that returns a sorting function to be used with Array.sort that
 * will sort the allTokens array based on references. This is to make sure
 * if you use output references that you never use a reference before it is
 * defined.
 * @memberof module:formatHelpers
 * @example
 * ```javascript
 * dictionary.allTokens.sort(sortByReference(dictionary))
 * ```
 * @param {Dictionary} dictionary
 * @returns {Function}
 */
 function sortByReference(dictionary) {
  // The sorter function is recursive to account for multiple levels of nesting
  function sorter(a, b) {
    const aComesFirst = -1;
    const bComesFirst = 1;

    // If token a uses a reference and token b doesn't, b might come before a
    // read on..
    if (a.original && dictionary.usesReference(a.original.value)) {
      // Both a and b have references, we need to see if the reference each other
      if (b.original && dictionary.usesReference(b.original.value)) {
        const aRefs = dictionary.getReferences(a.original.value);
        const bRefs = dictionary.getReferences(b.original.value);

        aRefs.forEach(aRef => {
          // a references b, we want b to come first
          if (aRef.name === b.name) {
            return bComesFirst;
          }
        });

        bRefs.forEach(bRef => {
          // ditto but opposite
          if (bRef.name === a.name) {
            return aComesFirst;
          }
        });

        // both a and b have references and don't reference each other
        // we go further down the rabbit hole (reference chain)
        return sorter(aRefs[0], bRefs[0]);
      // a has a reference and b does not:
      } else {
        return bComesFirst;
      }
    // a does not have a reference it should come first regardless if b has one
    } else {
      return aComesFirst;
    }
  }

  return sorter;
}

module.exports = sortByReference;