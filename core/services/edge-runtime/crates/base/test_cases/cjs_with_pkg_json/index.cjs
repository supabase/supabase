const isEven = require("is-even");

export default {
  fetch() {
    return Response.json({
      even: isEven(100),
    });
  },
};
