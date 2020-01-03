/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  docs: {
    Introduction:[
      "about",
      "faq"
    ],
    Library:[
      "library/getting-started",
      {
        type: "category",
        label: "Realtime",
        items: [
          "library/realtime/subscribe"
        ]
      },
      {
        type: "category",
        label: "RESTful",
        items: [
          "library/restful/post",
          "library/restful/get",
          "library/restful/patch",
          "library/restful/delete"
        ]
      }
    ],
    Guides:[
      "guides/examples"
    ]
  }
};
