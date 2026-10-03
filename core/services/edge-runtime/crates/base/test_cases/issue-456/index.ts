import { STATUS_CODE } from "jsr:@std/http";
console.log(STATUS_CODE.Accepted);

export default {
  fetch() {
    return new Response("meow");
  },
};
