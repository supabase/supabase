import foobar from "npm:@meowmeow/foobar";
import isOdd from "npm:is-odd";

console.log(foobar());

export default {
  fetch() {
    return Response.json({
      meow: typeof foobar,
      odd: isOdd(1),
    });
  },
};
